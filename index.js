addEventListener('fetch', (event) => {
    event.respondWith(handleRequest(event.request)
        .catch((err) => new Response(err.stack, { status: 500 }))
    );
})
  
addEventListener("scheduled", event => {
    event.waitUntil(handleRequest(event))
})

async function handleRequest(event) {
    const skuList = [
        'slaplenyog5g14q8cx1b',
        'slaplenyog5g14b'
    ]

    if (DISCORD_WEBHOOK === undefined ) {
        return new Response("Webhook is not defined. Please add DISCORD_WEBHOOK.")
    } else {
        discordWebhook = DISCORD_WEBHOOK
    }

    let discordResponse = new Response("Ok, nothing to report.")

    for (const sku of skuList){
        let webuyResponse = await fetch("https://wss2.cex.uk.webuy.io/v3/boxes/" + sku + "/detail")

        if (webuyResponse.status === 200){
            let json = await webuyResponse.json()

            console.log(json)
            console.log(json.response.data)

            if (json.response.data.boxDetails[0].outOfStock === 0){
                console.log(encodeURIComponent(json.response.data.boxDetails[0].imageUrls.medium))
                let bodyToSend = JSON.stringify({
                    content: "⚠️⚠️⚠️ Stock alert <@228574821590499329> <@159016432498114560> ",
                    embeds: [
                        {
                            title: json.response.data.boxDetails[0].boxName,
                            url: "https://uk.webuy.com/product-detail?id=" + sku,
                            fields: [
                                {
                                    name: "SKU ID",
                                    value: sku,
                                    inline: true
                                },
                                {
                                    name: "Current price",
                                    value: "£" + String(json.response.data.boxDetails[0].sellPrice),
                                    inline: true
                                },
                                {
                                    name: "Quantity",
                                    value: String(json.response.data.boxDetails[0].ecomQuantityOnHand),
                                    inline: true
                                },
                                {
                                    name: "Link",
                                    value: String("https://uk.webuy.com/product-detail?id=" + sku),
                                    inline: false
                                }
                            ],
                            thumbnail: {
                                url: encodeURI(json.response.data.boxDetails[0].imageUrls.medium)
                            }
                        }
                    ]
                })

                console.log(bodyToSend)

                discordResponse = await fetch(discordWebhook, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: bodyToSend
                })
                console.log(discordResponse)
            } else {}
        } else {
            discordResponse = await fetch(discordWebhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: "Fetch failed for `" + sku + "` with error code `" + webuyResponse.status + "`:\n```\n" + webuyResponse.body + "```" 
                })
            })
        }
    }

    return discordResponse
    
}


