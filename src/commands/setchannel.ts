import { ICommand } from 'wokcommands' 
import fs from 'fs'
import { CacheType, InteractionCollector, MessageActionRow,MessageButton, MessageComponentInteraction} from 'discord.js'

export default {
    names: 'setchannel',
    description: 'Set the channel where bot will send map changes',
    slash: true,
    expectedArgs: '<channel>',
    expectedArgsTypes: ['CHANNEL'],
    minArgs: 1,
    maxArgs: 1,
    cooldown: '60s',
    callback: async ({message, interaction,client,args}) => {
        const channel = client.channels.cache.get(args[0])
        let collector: InteractionCollector<MessageComponentInteraction<CacheType>> | undefined 
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
        if (channel?.type !== 'GUILD_TEXT'){
            collector = interaction.channel?.createMessageComponentCollector()
            if (interaction){
                await interaction.reply({content: 'Це має бути текстовий канал!',components: [row]})
            } else {
                await message.channel.send({content: 'Це має бути текстовий канал!',components: [row]})
            }
            collector?.on('collect', async id => {
                if (id.customId === 'en') {
                    row.components[1].setDisabled(false)
                    row.components[0].setDisabled(true)
                    await id.update({ content: 'This must be text channel!', components: [row]})
                } else if (id.customId === 'ua') {
                    row.components[0].setDisabled(false)
                    row.components[1].setDisabled(true)
                    await id.update({ content: 'Це має бути текстовий канал!', components: [row]})
                }
            })

        } else {
            fs.readFile('./channels.json','utf-8',async (err,data) => {
                if (err){
                    console.log(err)
                    return
                }
                let json = JSON.parse(data)
                json[interaction.guild!.id] = channel.id
                if (interaction){
                    await interaction.reply({content: 'Канал змінено', components: [row]})
                } else {
                    await message.reply({content: 'Канал змінено', components: [row]})
                }
                collector = interaction.channel?.createMessageComponentCollector()
                collector?.on('collect', async id => {
                    if (id.customId === 'en') {
                        row.components[1].setDisabled(false)
                        row.components[0].setDisabled(true)
                        await id.update({ content: 'Channel changed', components: [row]})
                    } else if (id.customId === 'ua') {
                        row.components[0].setDisabled(false)
                        row.components[1].setDisabled(true)
                        await id.update({ content: 'Канал змінено', components: [row]})
                    }
                })
                json = JSON.stringify(json,null,4)
                fs.writeFile('channels.json',json,(err) => console.log(err))
            })
        }
    }
} as ICommand