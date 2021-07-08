package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"html"
	"html/template"
	"net/http"
	"net/smtp"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"

	"github.com/jordan-wright/email"
)

type Response struct {
	Result string `json:"res"`
}

type Attachments struct {
	Filename           string `json:"filename"`
	Content            string `json:"content"`
	ContentType        string `json:"contentType"`
	ContentDisposition string `json:"contentDisposition"`
	Cid                string `json:"cid"`
}

type Reuirements struct {
	Host     string        `json:"host"`
	From     string        `json:"from"`
	Password string        `json:"password"`
	BCC      []string      `json:"bcc"`
	CC       []string      `json:"cc"`
	To       []string      `json:"to"`
	Subject  string        `json:"subject"`
	Body     string        `json:"body"`
	Parts    []Attachments `json:"data"`
	FilePath []string      `json:"filepath"`
}

func home(w http.ResponseWriter, r *http.Request) {

	t, err := template.ParseFiles("index.html")
	if err != nil {
		panic(err)
	}

	err = t.Execute(w, nil)

	if err != nil {
		panic(err)
	}
}

func m(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Getting Data....")
	e, b := new(Reuirements), new(bytes.Buffer)
	json.NewDecoder(r.Body).Decode(&e)

	t, err := template.ParseFiles("temp.html")
	if err != nil {
		panic(err)
	}

	err = t.Execute(b, e)
	if err != nil {
		panic(err)
	}

	fmt.Println("Sending email....")

	result := sendMail(*e, *b)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(Response{Result: result})
}

func sendMail(e Reuirements, b bytes.Buffer) string {

	mail := email.NewEmail()
	mail.From = e.From
	mail.Bcc = e.BCC
	mail.Cc = e.CC
	mail.To = e.To
	mail.Subject = e.Subject
	mail.HTML = []byte(html.UnescapeString((b.String())))

	if len(e.FilePath) != 0 {
		for _, filepath := range e.FilePath {
			_, err := mail.AttachFile(filepath)
			if err != nil {
				return fmt.Sprint(err)
			}
		}
	}

	for _, part := range e.Parts {
		content, err := base64.StdEncoding.DecodeString(string(part.Content))
		if err != nil {
			return fmt.Sprint(err)
		}
		mail.Attach(bytes.NewReader(content), part.Cid, part.ContentType)
	}

	err := mail.Send(fmt.Sprint("smtp.", e.Host, ":587"), smtp.PlainAuth("", strings.Split(strings.Split(e.From, "<")[1], `>`)[0], e.Password, fmt.Sprint("smtp.", e.Host)))
	if err != nil {
		fmt.Println(err)
		return fmt.Sprint(err)
	}
	fmt.Println("Email Sent.")
	return "Email Sent"
}


// Original Author - https://gist.github.com/hyg/9c4afcd91fe24316cbf0
func openbrowser(url string) {
	var err error

	switch runtime.GOOS {
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	default:
		err = fmt.Errorf("unsupported platform")
	}
	if err != nil {
		panic(err)
	}

}

func main() {
	port := 5000
	if len(os.Args) == 2{
		num, err := strconv.Atoi(os.Args[1])
		if err!=nil{
			port = 5000
		} else {
			port = num
		} 
	}
	fmt.Println(port)
	localhost := fmt.Sprint("localhost:", port)

	http.HandleFunc("/", home)
	http.HandleFunc("/mail", m)

	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	fmt.Println("\nserver is running\n ")
	openbrowser("http://" + localhost)
	if err := http.ListenAndServe(localhost, nil); err != nil {
		panic(err)
	}
}
