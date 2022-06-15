const { Client, Intents, MessageEmbed} = require('discord.js')
const channels = require('./channels.json')
const WOKCommands = require('wokcommands')
const path = require('path')
const {update,checkUpdates} = require('./map')
const translate = require('translate-google')
const fsExtra = require('fs-extra')
require('dotenv').config()


const client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ],
})



const sendUpdates = (info,enInfo) => new Promise(async (res,rej) => {
    try {
        for (let fetchedGuild of await client.guilds.fetch()){
            const guild = client.guilds.cache.get(fetchedGuild[0])
            const channel = guild.channels.cache.get(channels[fetchedGuild[0]])
            const today  = new Date()
            const embed = new MessageEmbed({
                title: 'Map update/Оновлення карти',
                url: 'https://deepstatemap.live/',
                footer: {
                    text: '©DeepStateMap',
                    icon_url: 'https://cdn4.telegram-cdn.org/file/q68DjfhmrJ8NtmhYppdyAr-974N9uLGSFmj3pxrIGWPu1pP-lOCSSzmNbCPOrZPMP_Y0weNdBV4jE63HlDgnVmxORQt3rPA9rYIprq2vYND_JTQsuDlkWEi0WoY9p_iCZPb2lX9FZE0qIa3H8Q1N0KQU1Q4yno0NIMzK9t2KQ-1AQDG54_-nACo7Uc2C4-8cICnGwu-dJqi4_mNZBsrcCcd1nhRie9pWic1njgw9Hy9bFqMuM02tOuY4_N4rMH-gGmtXJi-kQ13bY7JdI5oWY7QVXE4BP0i8Zgsso26v3q7fu-b6mbQWc1Ge9dNCG6RGBvM4zBUhC-6L3X-J2nIhZQ.jpg'
                },
                timestamp: today.toLocaleDateString("uk")
            })
            .setImage('attachment://map.png')
            if (channel){
                channel.send({
                    files: [{
                        attachment: './map.png',
                        name: 'map.png'
                    }],
                    embeds: [embed]
                })
                channel.send(`\n------------------------------------------------------------------------------------------------------------\n`)
                channel.send(`Зміни:\n${info}\n\nChanges:\n${enInfo}`)
                fsExtra.readdirSync('./changes').forEach(file => {
                    try {
                        channel.send({
                            files: [{
                                attachment: `./changes/${file}`,
                                name: file
                            }]
                        })
                    } catch (err) {
                        console.log(err)
                    }
                }) 
            }
        }
        res('ok')
    } catch (err) {
        rej(err)
    }
})

client.once('ready', async () => {  
    console.log('Ready!')
    new WOKCommands(client, {
        commandsDir: path.join(__dirname, 'commands')
    }).setPrefix('!')
    for (let guild of await client.guilds.fetch()){
        if (!(guild[0] in channels)){
            channels[guild[0]] = ''
            const json = JSON.stringify(channels,null,4)
            fsExtra.writeFile('./channels.json', json,(err) => console.log(err))
        }
    }
    setInterval(async () => {
        try {
            if (await checkUpdates()) {
                const info = await update()
                const enInfo = await translate(info, {from: 'uk', to: 'en'})
                await sendUpdates(info,enInfo)
                await fsExtra.emptyDir('./changes')
                fsExtra.remove('map.png')
            }
        } catch (err){
            console.log(err)
        }
    },150000)
})



client.on('guildCreate', async guild => {
	channels[guild.id] = ''
    const json = JSON.stringify(channels,null,4)
    fsExtra.writeFile(channels, json)
    const row = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setEmoji('🇬🇧')
            .setCustomId('en')
            .setStyle('PRIMARY')
    ).addComponents(
        new MessageButton()
            .setEmoji('🇺🇦')
            .setCustomId('ua')
            .setStyle('PRIMARY')
    )
    const channel = guild.systemChannel()
    let collector
    let embed = new MessageEmbed({
        title: 'Дякую,що добавили мене!',
        description: 'Тепер ви зможете бачити зміни на карті Deep Stateᵘᵃ.Використайте команду /setchannel, щоб бот міг надсилати оновлення на мапі\n[Сайт](https://deepstatemap.live)',
        url: 'https://deepstatemap.live',
        footer: {
            text: '©DeepStateMap',
            icon_url: 'https://cdn4.telegram-cdn.org/file/q68DjfhmrJ8NtmhYppdyAr-974N9uLGSFmj3pxrIGWPu1pP-lOCSSzmNbCPOrZPMP_Y0weNdBV4jE63HlDgnVmxORQt3rPA9rYIprq2vYND_JTQsuDlkWEi0WoY9p_iCZPb2lX9FZE0qIa3H8Q1N0KQU1Q4yno0NIMzK9t2KQ-1AQDG54_-nACo7Uc2C4-8cICnGwu-dJqi4_mNZBsrcCcd1nhRie9pWic1njgw9Hy9bFqMuM02tOuY4_N4rMH-gGmtXJi-kQ13bY7JdI5oWY7QVXE4BP0i8Zgsso26v3q7fu-b6mbQWc1Ge9dNCG6RGBvM4zBUhC-6L3X-J2nIhZQ.jpg'
        }
    })  
    if (channel){
        channel.send({
            embeds: [embed]
        })
        collector = channel.createMessageComponentCollector()
    }
    else if (guild.members.cache.get(guild.ownerId)) {
        const owner = guild.members.cache.get(guild.ownerId)
        const message = await owner.send({
            embeds: [embed]
        })
        collector = message.channel.createMessageComponentCollector()
    }
    collector?.on('collect', async id => {
        if (id.customId === 'en') {
            embed = new MessageEmbed({
                title: 'Thanks for adding me!',
                description: 'Now you can see the changes on the Deep State mapᵘᵃ. Use the /setchannel command so that the bot can send updates on the map\n[Site](https://deepstatemap.live)',
                url: 'https://deepstatemap.live',
                footer: {
                    text: '©DeepStateMap',
                    icon_url: 'https://cdn4.telegram-cdn.org/file/q68DjfhmrJ8NtmhYppdyAr-974N9uLGSFmj3pxrIGWPu1pP-lOCSSzmNbCPOrZPMP_Y0weNdBV4jE63HlDgnVmxORQt3rPA9rYIprq2vYND_JTQsuDlkWEi0WoY9p_iCZPb2lX9FZE0qIa3H8Q1N0KQU1Q4yno0NIMzK9t2KQ-1AQDG54_-nACo7Uc2C4-8cICnGwu-dJqi4_mNZBsrcCcd1nhRie9pWic1njgw9Hy9bFqMuM02tOuY4_N4rMH-gGmtXJi-kQ13bY7JdI5oWY7QVXE4BP0i8Zgsso26v3q7fu-b6mbQWc1Ge9dNCG6RGBvM4zBUhC-6L3X-J2nIhZQ.jpg'
                }
            })
            row.components[1].setDisabled(false)
            row.components[0].setDisabled(true)
            await id.update({ content: 'Channel changed', components: [row], embeds: [embed]})
        } else if (id.customId === 'ua') {
            embed = new MessageEmbed({
                title: 'Дякую,що добавили мене!',
                description: 'Тепер ви зможете бачити зміни на карті Deep Stateᵘᵃ.Використайте команду /setchannel, щоб бот міг надсилати оновлення на мапі\n[Сайт](https://deepstatemap.live)',
                url: 'https://deepstatemap.live',
                footer: {
                    text: '©DeepStateMap',
                    icon_url: 'https://cdn4.telegram-cdn.org/file/q68DjfhmrJ8NtmhYppdyAr-974N9uLGSFmj3pxrIGWPu1pP-lOCSSzmNbCPOrZPMP_Y0weNdBV4jE63HlDgnVmxORQt3rPA9rYIprq2vYND_JTQsuDlkWEi0WoY9p_iCZPb2lX9FZE0qIa3H8Q1N0KQU1Q4yno0NIMzK9t2KQ-1AQDG54_-nACo7Uc2C4-8cICnGwu-dJqi4_mNZBsrcCcd1nhRie9pWic1njgw9Hy9bFqMuM02tOuY4_N4rMH-gGmtXJi-kQ13bY7JdI5oWY7QVXE4BP0i8Zgsso26v3q7fu-b6mbQWc1Ge9dNCG6RGBvM4zBUhC-6L3X-J2nIhZQ.jpg'
                }
            })
            row.components[0].setDisabled(false)
            row.components[1].setDisabled(true)
            await id.update({ content: 'Канал змінено', components: [row] ,embeds: [embed]})
        }
    })
})

client.on('guildDelete', guild => {
    delete channels[guild.id]
    const json = JSON.stringify(channels,null,4)
    fsExtra.writeFile(channels, json)
})


client.login(process.env.TOKEN)