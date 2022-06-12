import { ICommand } from 'wokcommands' 
import fs from 'fs'


export default {
    names: 'setchannel',
    description: 'Set the channel where bot will send map changes',
    testOnly: true,
    slash: true,
    expectedArgs: '<channel>',
    expectedArgsTypes: ['CHANNEL'],
    minArgs: 1,
    maxArgs: 1,
    cooldown: '60s',
    callback: ({message, interaction, channel}) => {
        fs.readFile('./channels.json','utf-8',(err,data) => {
            if (err){
                console.log(err)
                return
            }
            let json = JSON.parse(data)
            if (interaction){
                json[interaction.guild!.id] = channel.id
                interaction.reply('Channel changed!')
            } else {
                json[message.guild!.id] = channel.id
                message.reply('Channel changed!')
            }
            json = JSON.stringify(json,null,4)
            fs.writeFile('channels.json',json,(err) => console.log(err))
        })
    }
} as ICommand