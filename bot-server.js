const axios = require('axios');
const admin = require('firebase-admin')
require("dotenv").config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const cors = require('cors')
const client = require('twilio')(accountSid, authToken);
const express = require('express')
const app = express();

app.use(cors())
let currentStatus = {
    sixty: null,
    seventy: null,
    eighty: null
}

const cred = {
    type: process.env.FB_ACCOUNT_TYPE,
    "project_id": process.env.FB_PROJECT_ID,
    "private_key_id": process.env.FB_KEY_ID,
    "private_key": process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FB_CLIENT_EMAIL,
    "client_id": process.env.FB_CLIENT_ID,
    "auth_uri": process.env.FB_AUTH_URI,
    "token_uri": process.env.FB_TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.FB_CERT_URL,
    "client_x509_cert_url": process.env.FB_CLIEND_CERT
  }


admin.initializeApp({
    credential: admin.credential.cert(cred)
})

const db = admin.firestore()


const models = {
    one: {
        url: "www.bestbuy.com/site/nvidia-geforce-rtx-3060-ti-8gb-gddr6-pci-express-4-0-graphics-card-steel-and-black/6439402.p?skuId=6439402",
    },
    two: {
        url: "www.bestbuy.com/site/nvidia-geforce-rtx-3070-8gb-gddr6-pci-express-4-0-graphics-card-dark-platinum-and-black/6429442.p?skuId=6429442",
    },
    three: {
        url: "www.bestbuy.com/site/nvidia-geforce-rtx-3080-10gb-gddr6x-pci-express-4-0-graphics-card-titanium-and-black/6429440.p?skuId=6429440",
    },

}

const sendEmails = {
    sixty: {
        name: "3060ti"
    },
    seventy: {
        name: "3070"
    },
    eighty: {
        name: "3080"
    }
};


sendEmails.sixty.send = () => {
    console.log("send sixty emails")

    db.collection('3060ti').doc('lastsent').set({
        time: Date.now()
    })

    db.collection('3060ti').get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                if  (doc.id !== 'lastsent') {
                    client.messages
                        .create({
                            body: 'The Nvidia 3060ti was found in stock at http://www.bestbuy.com/site/nvidia-geforce-rtx-3060-ti-8gb-gddr6-pci-express-4-0-graphics-card-steel-and-black/6439402.p?skuId=6439402',
                            from: '+13512228445',
                            to: doc.data().phoneNum
                        })
                        .then(message => console.log(message.sid))
                        .catch((err) => {
                            console.log(err)
                        })


                }
            })
        })

}

sendEmails.seventy.send = () => {
    console.log("send seventy emails")

    db.collection('3070').doc('lastsent').set({
        time: Date.now()
    })

    db.collection('3070').get()
    .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            if  (doc.id !== 'lastsent') {
                client.messages
                    .create({
                        body: 'The Nvidia 3070 was found in stock at http://www.bestbuy.com/site/nvidia-geforce-rtx-3070-8gb-gddr6-pci-express-4-0-graphics-card-dark-platinum-and-black/6429442.p?skuId=6429442',
                        from: '+13512228445',
                        to: doc.data().phoneNum
                    })
                    .then(message => console.log(message.sid))
                    .catch((err) => {
                        console.log(err)
                    })


            }
        })
    })
}

sendEmails.eighty.send = () => {
    console.log("send eighty emails")
    //https://www.bestbuy.com/site/nvidia-geforce-rtx-3080-10gb-gddr6x-pci-express-4-0-graphics-card-titanium-and-black/6429440.p?skuId=6429440
    db.collection('3080').get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                if  (doc.id !== 'lastsent') {
                    client.messages
                        .create({
                            body: 'The Nvidia 3080 was found in stock at http://www.bestbuy.com/site/nvidia-geforce-rtx-3080-10gb-gddr6x-pci-express-4-0-graphics-card-titanium-and-black/6429440.p?skuId=6429440',
                            from: '+13512228445',
                            to: doc.data().phoneNum
                        })
                        .then(message => console.log(message.sid))
                        .catch((err) => {
                            console.log(err)
                        })


                }
            })
        })

    db.collection('3080').doc('lastsent').set({
        time: Date.now()
    })
}


const getStatus =  async () => {
    let results = {
        sixty: false,
        seventy: false,
        eighty: false
    }
    try {
        let sixty = await axios(models.one.url);
        results.sixty = !sixty.data.includes('<strong>Sold Out</strong>');

    } catch(err) {
        console.error(err)
    }

    try {
          let seventy = await axios(models.two.url)
        results.seventy = !seventy.data.includes('<strong>Sold Out</strong>');
    } catch(err) {
        console.error(err)
    }

    try {
       let eighty = await axios(models.three.url)
        results.eighty = !eighty.data.includes('<strong>Sold Out</strong>');
    } catch(err) {
        console.error(err)
    }




    console.log(results)
    currentStatus = results
    return results
}


let repeat = setInterval(() => {
    getStatus()
    .then(res => {
        let models = Object.keys(res)
        models.forEach((m) => {
            if (res[m] === true) {
                db.collection(sendEmails[m].name).get()
                    .then((querySnapshot) => {
                        querySnapshot.forEach((doc) => {
                            if (doc.id === "lastsent" && (Date.now() - doc.data().time >= 86400000)) {
                                sendEmails[m].send()
                            }
                        })
                    })
            }
        })
    })
    .catch(err => {
        console.error(err)
    })

}, 150000)

app.get('/status', (req, res) => {
    res.send(currentStatus)
})

app.get('/', (req, res) => {
    res.send(JSON.stringify(currentStatus))
  })



const port = process.env.PORT || 3000


app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})