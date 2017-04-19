const mongo = require('mongodb');
const mc = mongo.MongoClient;
const jsonfile = require('jsonfile');

const url = 'mongodb://localhost:27017/enron';

mc.connect(url, function(err, db){
  if (err) console.log(`Unable to connect to database at ${url}`);
  else {
    console.log(`Connection successful at ${url}.`);
    let emails = db.collection('emails');

    const emailsInfo = {
      numberOfEmails: {
        info: "Total number of emails in the enron databse",
        data: {}
      },
      oldestEmail: {
        info: "The first email sent in the database, by date.",
        data: {}
      },
      newestEmail: {
        info: "The most recent email sent in the databse, by date.",
        data: {}
      },
      moneyList: {
        info: "The number of emails in the database that contain the word money.",
        data: 0
      },
      frequentSender: {
        info: "The email address and number of emails sent by the most frequent sender.",
        data: {}
      }
    };

    emails.find({}).toArray((error, emailList)=>{
      // get length
      emailsInfo.numberOfEmails.data = emailList.length;
      let emailsByDate = emailList.map((x)=>{
        return {
          date : new Date(x.date),
          _id : x._id
        }
      });

      emailsByDate.sort((a,b)=>a.date - b.date);

      // console.log(emailsByDate[0]);
      // console.log(emailsByDate[emailsByDate.length -1 ]);

      function init(){
        findOldest(emails);
      }

      function closeDB(){
        db.close(()=>{
          console.log(`Connection to ${url} closed.`);

          let filename = 'enronEmailsInfo.json';

          jsonfile.writeFile(filename, emailsInfo, {spaces: 2}, (err)=>{
            err ? console.log(err) : console.log(`${filename} has been created successfully.`);
          })

        });
      }

      function findOldest(emails){
        emails.findOne({_id:emailsByDate[0]._id}, (err, email)=>{
          if (err) console.log(err);
          else {
            emailsInfo.oldestEmail.data = email;
            findNewest(emails);
          }
        })
      }

      function findNewest(emails){
        emails.findOne({_id:emailsByDate[emailsByDate.length -1 ]._id}, (err, email)=>{
          if (err) console.log(err);
          else {
            emailsInfo.newestEmail.data = email;
            findMoney(emails);
          }
        })
      }

      function findMoney(emails){
        emails.find({text:/money/i}).toArray((err, emailList)=>{
          if (err) console.log(err);
          else {
            let moneyList = [];
            emailList.forEach((email)=>{
              moneyList.push(email);
            })
            emailsInfo.moneyList.data = moneyList.length;
            findFrequentSender(emails);
          }
        })
      }

      function findFrequentSender(emails){
        emails.find({}).toArray((err, emails)=>{
          if (err) console.log(err);
          else {
            let senderList = [];
            let senders = emails.map(x => x.sender);
            senders.forEach(function(sender){
              let found = senderList.find(function(el){
                return el.email === sender;
              })
              if (!found){
                senderList.push({
                  email: sender,
                  count: 1
                });
              } else {
                senderList[senderList.findIndex((el)=>{return el.email === sender})].count += 1;
              }
              // console.log(found);
            }) // end getting list.
            emailsInfo.frequentSender.data = senderList.sort((a,b)=> b.count - a.count)[0];

            closeDB();

          }
        })
      }

      init();

    })

  }
})
