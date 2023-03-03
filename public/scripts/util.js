function init() {
    console.log("initializing..");
    _initCurrentToasts();
}

function copy(content) {
    if(content) {
        navigator.clipboard.writeText(content);
        addToast("info", "Copied!", content);
    }
}

function deleteAccount(id) {
    console.log("deleting " + id);
}

const accountMap = new Map();

function initAccountCard(account) {
    const card = document.getElementById(account.id);

    const deleteButton = card.getElementsByClassName("xbutton").item(0);
    deleteButton.addEventListener("click", (e) => {
        alert(e.target.innerHTML);
    });

    accountMap.set(account, card);
}

function resetPage() {
    window.location = window.location.pathname;
}

const toasts = new Array();

function _initCurrentToasts() {
    const toastElements = document.getElementsByClassName("toast-container");

    for(let toast of toastElements) {
        toasts.push(toast);
        toast.getElementsByClassName("xbutton").item(0).addEventListener("click", () => {
            _removeToast(toast);
        });
        setTimeout(() => {
            _removeToast(toast);
        }, 8000)
    }
}

function addToast(type="info", title="Notification", message="Empty message") {
    const toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    
    const header = _createToastHeader(type, title, toastContainer);

    const body = _createToastBody(message, toastContainer);

    toastContainer.appendChild(header);
    toastContainer.appendChild(body);

    _handleToast(toastContainer);
}

function _createToastHeader(type, titleText, container) {
    const toastHeader = document.createElement("div");
    toastHeader.className = `toast-header ${type}`;

    const xButton = document.createElement("span");
    xButton.className = "xbutton";
    xButton.innerHTML = "X";

    xButton.addEventListener("click", () => {
        _removeToast(container);
    });

    const title = document.createElement("span");
    title.className = "toast-title";
    title.appendChild(document.createTextNode(titleText));

    toastHeader.appendChild(title);
    toastHeader.appendChild(xButton);

    return toastHeader;
}

function _createToastBody(message, container) {
    const body = document.createElement("div");
    body.className = "toast-body";

    const toastMessage = document.createElement("p");
    toastMessage.className = "toast-message";
    toastMessage.appendChild(document.createTextNode(message));

    body.appendChild(toastMessage);

    return body;
}

function _handleToast(toast=document.createElement("div")) {
    toasts.push(toast);

    document.getElementById("toastContainer").appendChild(toast);

    setTimeout(() => {
        _removeToast(toast);
    }, 8000);

    toast.parentElement.scrollTop = 0;
}

function _removeToast(toast) {
    console.log("removing toast: " + toast);
    toasts.splice(toasts.indexOf(toast), 1);
    toast.parentNode?.removeChild(toast);
}