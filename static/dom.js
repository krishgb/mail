const d = document

const getTemplates = async () => {
    const select = d.getElementById('templates')
    select.innerHTML = ''

    const data = await (await fetch('/get')).json()

    if (!data.templates) {
        select.hidden = true
        return
    } else {
        select.hidden = false
        const templates = JSON.parse(data.templates)


        templates.map(template => {
            const [[key, value]] = Object.entries(template)
            const option = d.createElement('option')
            option.selected = true
            option.value = value
            option.innerText = key
            select.appendChild(option)
        })
    }
}

d.addEventListener('DOMContentLoaded', e => {
    getTemplates()
})
const add = which => {
    const e = event

    const input = d.createElement('input')

    const iRemove = d.createElement('input')
    iRemove.type = 'button'
    iRemove.classList.add('minus')
    iRemove.value = '-'
    iRemove.onclick = remove

    switch (which) {
        case 'b':
            input.type = 'email'
            input.placeholder = 'koroSensei@ac.com'
            input.classList.add('bcc')
            break
        case 'c':
            input.type = 'email'
            input.placeholder = 'gojo@jujutsu.com'
            input.classList.add('cc')
            break
        case 1:
            input.type = 'email'
            input.placeholder = 'killua@hxh.com'
            input.classList.add('to')
            break
        case 2:
            input.type = 'text'
            input.placeholder = 'File path'
            input.onchange = fileName
            input.classList.add('attach')
            break
        default:
            input.type = 'file'
            input.accept = 'image/*'
            input.classList.add('imgFile')
            break
    }
    e.target.parentElement.nextElementSibling.appendChild(input)
    e.target.parentElement.nextElementSibling.appendChild(iRemove)
    input.focus()
}

const remove = () => {
    const e = event
    e.target.previousElementSibling.remove()
    e.target.remove()
}

const sus = () => {
    const e = event

    const b = d.getElementById('body')

    base64Data(e.target.files[0])
        .then(res => {
            b.innerHTML += `
                <img
                    width="100"
                    src=${res.original} 
                    alt="${e.target.files[0].name.split('.')[0].split(' ').join('_')}" />
            `
        })

    if (!e.target.files[0].type.includes('image/')) {
        alert(e.target.files[0].name + ' is not an image.')
        e.target.value = ''
    }
}

const format = cmd => {
    const r = document.getElementById('range')
    switch (cmd) {
        case 'createlink':
            document.execCommand(cmd, false, prompt('Enter the link here'));
            break;
        case 'foreColor':
            document.execCommand(cmd, false, document.getElementById('fcolor').value)
            break
        case '+':
            r.value = parseInt(r.value) + 1
            document.execCommand('fontSize', false, parseInt(r.value))
            break
        case '-':
            r.value = parseInt(r.value) - 1
            document.execCommand('fontSize', false, parseInt(r.value))
            break
        case 'hiliteColor':
            document.execCommand(cmd, false, document.getElementById('hcolor').value)
            break
        default:
            document.execCommand(cmd, false, null)
            break;
    }
}

const saveTempl = () => {

    const templateName = prompt('Give a name for this template')
    const options = d.querySelectorAll('#templates option')
    for (let i of options) {
        if (i.textContent === templateName) {
            alert('There is already a template with the same name.')
            return
        }
    }
    if (!templateName) return

    const template = d.getElementById('body').innerHTML
    const e = event

    fetch('/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            [templateName]: template
        })
    }).then(res => {
        getTemplates()
    })
}

const changeTemplate = () => {
    d.getElementById('body').innerHTML = event.target.value
}