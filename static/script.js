const $ = document
const [form, from, username, password, subject, body, host] = [
    $.querySelector('form'),
    $.getElementById('from'),
    $.getElementById('username'),
    $.getElementById('password'),
    $.getElementById('subject'),
    $.getElementById('body'),
    $.getElementById('host')
]


form.onsubmit = event => {
    event.preventDefault()
    document.querySelector('button').textContent = 'Sending...'
    isDisable('y')

    const withHost = from.value.trim().includes('@') ? from.value.trim() : from.value.trim() + host.value

    const to = $.getElementsByClassName('to')
    const attach = $.getElementsByClassName('attach')
    const bcc = $.getElementsByClassName('bcc')
    const cc = $.getElementsByClassName('cc')

    const bccs = set(bcc)
    const ccs = set(cc)
    const mailIDs = set(to)
    const attachments = set(attach)

    if (![...bccs, ...ccs, ...mailIDs].length) alert("Enter the receiver's mail address")
    else {

        const { content, data } = getAll()

        fetch('/mail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                host: from.value.trim().includes('@') ? from.value.trim().split('@')[1] : host.value.slice(1),
                from: `${username.value.trim()} <${withHost}>`,
                bcc: [...bccs],
                cc: [...ccs],
                to: [...mailIDs],
                password: password.value,
                subject: subject.value,
                body: content,
                filepath: [...attachments],
                data
            })
        }).then(res => res.json())
            .then(({ res }) => {
                document.querySelector('button').textContent = 'Submit...'

                isDisable()

                if (res === 'Email Sent') {
                    alert(res)
                } else if (res.includes('no such host')) {
                    alert(`Email not sent\n Internet Connection Error  \n\n(or) \n\nThere is no such host like  """${from.value.trim().includes('@') ? from.value.trim().split('@')[1] : host.value.slice(1)}"""`)
                } else if (res.includes('Username and Password not accepted')) {
                    alert('Username and Password not accepted')
                } else if (res.includes('This message was blocked because its content presents a potential')) {
                    alert(`This message was blocked because its content presents a potential security issue.\n\nFiles shouldn't end with this type of extensions: \n.ade, .adp, .apk, .appx, .appxbundle, .bat, .cab, .chm, .cmd, .com, .cpl, .dll, .dmg, .ex, .ex_, .exe, .hta, .ins, .isp, .iso, .jar, .js, .jse, .lib, .lnk, .mde, .msc, .msi, .msix, .msixbundle, .msp, .mst, .nsh, .pif, .ps1, .scr, .sct, .shb, .sys, .vb, .vbe, .vbs, .vxd, .wsc, .wsf, .wsh
                    \nFor more details: https://support.google.com/mail/?p=BlockedMessage`)
                } else {
                    alert(res)
                }
            })
    }
}

const fileName = () => {
    const path = event.target.value.trim()
    if (path === '') return
    if (!path.slice(-6).includes('.')) {
        event.target.value = ''
        alert(path + ': No File Found')
    }
}

const set = s => {
    const m = new Set()
    for (let i of s) {
        i.value.trim() !== '' && i.value.trim() !== from.value.trim() && m.add(i.value.trim())
    }
    return [...m]
}


const base64Data = async (file) => {
    let result_base64 = await new Promise((resolve) => {
        let fileReader = new FileReader();
        fileReader.onload = () => resolve(fileReader.result);
        fileReader.readAsDataURL(file);
    });

    return { original: result_base64, splitted: result_base64.split('base64,')[1] }
}

const getAll = () => {
    const data = []

    const clone = body.cloneNode(true)
    const imgs = clone.querySelectorAll('img')
    for (let i of imgs) {
        const [type, source] = [i.src.split(';')[0].replace('data:', ''), i.src.split('base64,')[1]]
        data.push({
            cid: i.alt,
            contentType: type,
            filename: i.alt + type.replace('image/', '.'),
            contentDisposition: 'inline',
            content: source
        })
        i.src = `cid:${i.alt}`
        for (let i of clone.querySelectorAll('.resize-frame')) i.remove()
        for (let i of clone.querySelectorAll('.resizer')) i.remove()
    }
    return { content: clone.innerHTML, data }
}


const isDisable = (yes) => {

    const buttons = $.querySelectorAll('button')
    const input = $.querySelectorAll('input')

    if (yes === 'y') {
        for (let i of [...buttons, ...input]) i.disabled = !0
        return
    } else {
        for (let i of [...buttons, ...input]) i.disabled = !1
    }

}