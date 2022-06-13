import { ICommand } from 'wokcommands' 
import fs from 'fs'
import { MessageActionRow,MessageButton,Message} from 'discord.js'

export default {
    names: 'setchannel',
    description: 'Set the channel where bot will send map changes',
    slash: true,
    expectedArgs: '<channel>',
    expectedArgsTypes: ['CHANNEL'],
    minArgs: 1,
    maxArgs: 1,
    cooldown: '60s',
    callback: async ({message, interaction, channel}) => {
        if (channel.type !== 'GUILD_TEXT'){
            const row = new MessageActionRow()
            .addComponents(
				new MessageButton()
					.setCustomId('en')
					.setEmoji(':flag_gb:')
					.setStyle('PRIMARY')
			)
            let collector
            if (interaction){
                collector = interaction.channel?.createMessageComponentCollector()
                await interaction.reply({content: 'Це має бути текстовий канал!',components: [row]})
            } else {
                collector = message.channel?.createMessageComponentCollector()
                await message.channel.send({content: 'Це має бути текстовий канал!',components: [row]})
            }
            collector?.on('collect', async id => {
                if (id.customId === 'en') {
                    await id.update({ content: 'This must be text channel!', components: [row]});
                }
            })

        } else {
            fs.readFile('./channels.json','utf-8',async (err,data) => {
                if (err){
                    console.log(err)
                    return
                }
                let json = JSON.parse(data)
                if (interaction){
                    json[interaction.guild!.id] = channel.id
                    await interaction.reply('Channel changed!')
                } else {
                    json[message.guild!.id] = channel.id
                    await message.reply('Channel changed!')
                }
                json = JSON.stringify(json,null,4)
                fs.writeFile('channels.json',json,(err) => console.log(err))
            })
        }
    }
} as ICommand