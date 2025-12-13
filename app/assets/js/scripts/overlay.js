/**
 * Script for overlay.ejs
 */

/* Overlay Wrapper Functions */

/**
 * Check to see if the overlay is visible.
 * 
 * @returns {boolean} Whether or not the overlay is visible.
 */
function isOverlayVisible() {
    return document.getElementById('main').hasAttribute('overlay')
}

let overlayHandlerContent

/**
 * Overlay keydown handler for a non-dismissable overlay.
 * 
 * @param {KeyboardEvent} e The keydown event.
 */
function overlayKeyHandler(e) {
    if (e.key === 'Enter' || e.key === 'Escape') {
        document.getElementById(overlayHandlerContent).getElementsByClassName('overlayKeybindEnter')[0].click()
    }
}
/**
 * Overlay keydown handler for a dismissable overlay.
 * 
 * @param {KeyboardEvent} e The keydown event.
 */
function overlayKeyDismissableHandler(e) {
    if (e.key === 'Enter') {
        document.getElementById(overlayHandlerContent).getElementsByClassName('overlayKeybindEnter')[0].click()
    } else if (e.key === 'Escape') {
        document.getElementById(overlayHandlerContent).getElementsByClassName('overlayKeybindEsc')[0].click()
    }
}

/**
 * Bind overlay keydown listeners for escape and exit.
 * 
 * @param {boolean} state Whether or not to add new event listeners.
 * @param {string} content The overlay content which will be shown.
 * @param {boolean} dismissable Whether or not the overlay is dismissable 
 */
function bindOverlayKeys(state, content, dismissable) {
    overlayHandlerContent = content
    document.removeEventListener('keydown', overlayKeyHandler)
    document.removeEventListener('keydown', overlayKeyDismissableHandler)
    if (state) {
        if (dismissable) {
            document.addEventListener('keydown', overlayKeyDismissableHandler)
        } else {
            document.addEventListener('keydown', overlayKeyHandler)
        }
    }
}

/**
 * Toggle the visibility of the overlay.
 * 
 * @param {boolean} toggleState True to display, false to hide.
 * @param {boolean} dismissable Optional. True to show the dismiss option, otherwise false.
 * @param {string} content Optional. The content div to be shown.
 */
function toggleOverlay(toggleState, dismissable = false, content = 'overlayContent') {
    if (toggleState == null) {
        toggleState = !document.getElementById('main').hasAttribute('overlay')
    }
    if (typeof dismissable === 'string') {
        content = dismissable
        dismissable = false
    }
    bindOverlayKeys(toggleState, content, dismissable)
    if (toggleState) {
        document.getElementById('main').setAttribute('overlay', true)
        // Make things untabbable.
        $('#main *').attr('tabindex', '-1')
        $('#' + content).parent().children().hide()
        $('#' + content).show()
        if (dismissable) {
            $('#overlayDismiss').show()
        } else {
            $('#overlayDismiss').hide()
        }
        $('#overlayContainer').fadeIn({
            duration: 250,
            start: () => {
                if (getCurrentView() === VIEWS.settings) {
                    document.getElementById('settingsContainer').style.backgroundColor = 'transparent'
                }
            }
        })
    } else {
        document.getElementById('main').removeAttribute('overlay')
        // Make things tabbable.
        $('#main *').removeAttr('tabindex')
        $('#overlayContainer').fadeOut({
            duration: 250,
            start: () => {
                if (getCurrentView() === VIEWS.settings) {
                    document.getElementById('settingsContainer').style.backgroundColor = 'rgba(0, 0, 0, 0.50)'
                }
            },
            complete: () => {
                $('#' + content).parent().children().hide()
                $('#' + content).show()
                if (dismissable) {
                    $('#overlayDismiss').show()
                } else {
                    $('#overlayDismiss').hide()
                }
            }
        })
    }
}

async function toggleServerSelection(toggleState) {
    await prepareServerSelectionList()
    toggleOverlay(toggleState, true, 'serverSelectContent')
}

/**
 * Set the content of the overlay.
 * 
 * @param {string} title Overlay title text.
 * @param {string} description Overlay description text.
 * @param {string} acknowledge Acknowledge button text.
 * @param {string} dismiss Dismiss button text.
 */
function setOverlayContent(title, description, acknowledge, dismiss = Lang.queryJS('overlay.dismiss')) {
    document.getElementById('overlayTitle').innerHTML = title
    document.getElementById('overlayDesc').innerHTML = description
    document.getElementById('overlayAcknowledge').innerHTML = acknowledge
    document.getElementById('overlayDismiss').innerHTML = dismiss
}

/**
 * Set the onclick handler of the overlay acknowledge button.
 * If the handler is null, a default handler will be added.
 * 
 * @param {function} handler 
 */
function setOverlayHandler(handler) {
    if (handler == null) {
        document.getElementById('overlayAcknowledge').onclick = () => {
            toggleOverlay(false)
        }
    } else {
        document.getElementById('overlayAcknowledge').onclick = handler
    }
}

/**
 * Set the onclick handler of the overlay dismiss button.
 * If the handler is null, a default handler will be added.
 * 
 * @param {function} handler 
 */
function setDismissHandler(handler) {
    if (handler == null) {
        document.getElementById('overlayDismiss').onclick = () => {
            toggleOverlay(false)
        }
    } else {
        document.getElementById('overlayDismiss').onclick = handler
    }
}

/* Server Select View */

document.getElementById('serverSelectConfirm').addEventListener('click', async () => {
    const listings = document.getElementsByClassName('serverListing')
    for (let i = 0; i < listings.length; i++) {
        if (listings[i].hasAttribute('selected')) {
            const serv = (await DistroAPI.getDistribution()).getServerById(listings[i].getAttribute('servid'))
            updateSelectedServer(serv)
            refreshServerStatus(true)
            toggleOverlay(false)
            return
        }
    }
    // None are selected? Not possible right? Meh, handle it.
    if (listings.length > 0) {
        const serv = (await DistroAPI.getDistribution()).getServerById(listings[i].getAttribute('servid'))
        updateSelectedServer(serv)
        toggleOverlay(false)
    }
})

document.getElementById('accountSelectConfirm').addEventListener('click', async () => {
    const listings = document.getElementsByClassName('accountListing')
    for (let i = 0; i < listings.length; i++) {
        if (listings[i].hasAttribute('selected')) {
            const authAcc = ConfigManager.setSelectedAccount(listings[i].getAttribute('uuid'))
            ConfigManager.save()
            updateSelectedAccount(authAcc)
            if (getCurrentView() === VIEWS.settings) {
                await prepareSettings()
            }
            toggleOverlay(false)
            validateSelectedAccount()
            return
        }
    }
    // None are selected? Not possible right? Meh, handle it.
    if (listings.length > 0) {
        const authAcc = ConfigManager.setSelectedAccount(listings[0].getAttribute('uuid'))
        ConfigManager.save()
        updateSelectedAccount(authAcc)
        if (getCurrentView() === VIEWS.settings) {
            await prepareSettings()
        }
        toggleOverlay(false)
        validateSelectedAccount()
    }
})

// Bind server select cancel button.
document.getElementById('serverSelectCancel').addEventListener('click', () => {
    toggleOverlay(false)
})

document.getElementById('accountSelectCancel').addEventListener('click', () => {
    $('#accountSelectContent').fadeOut(250, () => {
        $('#overlayContent').fadeIn(250)
    })
})

function setServerListingHandlers() {
    const listings = Array.from(document.getElementsByClassName('serverListing'))
    listings.map((val) => {
        val.onclick = e => {
            if (val.hasAttribute('selected')) {
                return
            }
            const cListings = document.getElementsByClassName('serverListing')
            for (let i = 0; i < cListings.length; i++) {
                if (cListings[i].hasAttribute('selected')) {
                    cListings[i].removeAttribute('selected')
                }
            }
            val.setAttribute('selected', '')
            document.activeElement.blur()
        }
    })
}

function setAccountListingHandlers() {
    const listings = Array.from(document.getElementsByClassName('accountListing'))
    listings.map((val) => {
        val.onclick = e => {
            if (val.hasAttribute('selected')) {
                return
            }
            const cListings = document.getElementsByClassName('accountListing')
            for (let i = 0; i < cListings.length; i++) {
                if (cListings[i].hasAttribute('selected')) {
                    cListings[i].removeAttribute('selected')
                }
            }
            val.setAttribute('selected', '')
            document.activeElement.blur()
        }
    })
}

async function populateServerListings() {
    const distro = await DistroAPI.getDistribution()
    const giaSel = ConfigManager.getSelectedServer()
    const servers = distro.servers
    let htmlString = ''
    for (const serv of servers) {
        htmlString += `<button class="serverListing" servid="${serv.rawServer.id}" ${serv.rawServer.id === giaSel ? 'selected' : ''}>
            <img class="serverListingImg" src="${serv.rawServer.icon}"/>
            <div class="serverListingDetails">
                <span class="serverListingName">${serv.rawServer.name}</span>
                <span class="serverListingDescription">${serv.rawServer.description}</span>
                <div class="serverListingInfo">
                    <div class="serverListingVersion">${serv.rawServer.minecraftVersion}</div>
                    <div class="serverListingRevision">${serv.rawServer.version}</div>
                    ${serv.rawServer.mainServer ? `<div class="serverListingStarWrapper">
                        <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
	<defs>
		<image  width="16" height="16" id="img1" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAAXNSR0IB2cksfwAAAbBQTFRFAAAAb5OucJOvbpKsd5irdpOnXW2CcZOzdZawjaa4jqCxZ3eMXWyCXGx+cZOzkKbCyNHY0NfdjqC2Xm2EXm2DcZO0qbjY4+fP6ezLqbXLX22GX22HbJKobpKrcpO1i6HFwcfr7u/Z8fPNwcrehJewZHOLX22FYG2IcZOydZavjqW/q7nbw8ju1NX58PDe8vTP0NXrv8fhqbLOipq2c4GhY26QfJbOf5nDiqLBu8bZ2d3d5+fr6ent7+yy7Oma4+HG7u/a6evbvsbclaLEeYaqZG6RfZbShZzMmavN09jm6+3V8/Pe8fHh6+OJ5dtr5OG47e/T4ebPwMjdmafGeomoYW6NeZXGe5a+kqHBrrbWyszw0dH85uDQ6OLGxcvut8Dfj5+/ipu6c4KdYG2JZ2+ZZG6UZG6Ri5nBycny8fDn7u/fuMHiiZy2ZXONYm6MYW2KaW+eZ2+ZZW+TaXSZsbTg6+zk4ubTkaDCZXOPY3CLYm6OYm6NYm6MkJzCy87tztDskJ3HZm+XZm+YYW6MeIKspKjcq67kgobDbXGnbXGnbHGliIvOi47RcXKzcHKycHKvWca27AAAAJB0Uk5TAFxrSMLRUinC///WLgXM/////+YazP/////mGinMzPX/////+tHMUkjC/////////////9FrPaP////////////////We2vR////////////////4Y9S1v/////////////gei7m5vr//////OjmXAUaGtH/////6DEaCsz/////5hpS0f//4FwKa9bhenuP9/GAPQAAAGlJREFUeJxjZIAARsZ/UAaEYmZkZPyFJMDOCAaf4QJ8EIE3cAFRiMBTiIAMIwLcBApoMCKD04xmjGjADV2AIQyFOxdoaAoSfyLIlgIkgVaoO2og3Dq4w5ohAuUIz3UBucXIvmXoYyyEMACt5A6r1B1j4wAAAABJRU5ErkJggg=="/>
	</defs>
	<style>
	</style>
	<use id="Layer 2" href="#img1" x="2" y="2"/>
</svg>
                        <span class="serverListingStarTooltip">${Lang.queryJS('settings.serverListing.mainServer')}</span>
                    </div>` : ''}
                </div>
            </div>
        </button>`
    }
    document.getElementById('serverSelectListScrollable').innerHTML = htmlString

}

function populateAccountListings() {
    const accountsObj = ConfigManager.getAuthAccounts()
    const accounts = Array.from(Object.keys(accountsObj), v => accountsObj[v])
    let htmlString = ''
    for (let i = 0; i < accounts.length; i++) {
        htmlString += `<button class="accountListing" uuid="${accounts[i].uuid}" ${i === 0 ? 'selected' : ''}>
            <img src="https://mc-heads.net/head/${accounts[i].uuid}/40">
            <div class="accountListingName">${accounts[i].displayName}</div>
        </button>`
    }
    document.getElementById('accountSelectListScrollable').innerHTML = htmlString

}

async function prepareServerSelectionList() {
    await populateServerListings()
    setServerListingHandlers()
}

function prepareAccountSelectionList() {
    populateAccountListings()
    setAccountListingHandlers()
}