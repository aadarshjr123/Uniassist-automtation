const express = require("express");
const axios = require("axios");
const app = express();
const port = process.env.PORT || 5000;
const nodemailer = require("nodemailer");
// const jsdom = require("jsdom");
// const { JSDOM } = jsdom;
const cron = require('node-cron');
const chalkAnimation = require('chalk-animation');

//api for uni-assist
var data = JSON.stringify({
  start: 0,
  limit: 10000,
  filter: {
    volltext: "",
    semester: [43],
    hochschule: [],
    bundesland: [],
    studienfach: [],
    abschlussgruppe: [4],
  },
});

var config = {
  method: "post",
  url: "https://mya-backend.uni-assist.de/services/semesterangebot",
  headers: {
    "Content-Type": "application/json",
  },
  data: data,
};
let coursesID = [];
let coursesDetails = [];
let array = [];

//add data to db.
async function createDB(data) {
  const neo4j = require('neo4j-driver')
      
      const uri = 'url of neo4j';
      const user = 'user id';
      const password = 'pass';
      
      const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
      const session = driver.session()
     
      const person1Name = data;
      
      try {
        const readQuery = `CREATE (CourseID {ID: $person1Name})`
                           
        const writeResult = await session.writeTransaction(tx =>
          tx.run(readQuery, { person1Name })
        )
      //   writeResult
      console.log("Data added");
    //   writeResult.records.forEach(record => {
    //    console.log(record);
    //  })
      //   readResult
      } catch (error) {
        console.error('Something went wrong: ', error)
      } finally {
        await session.close()
      }
     
      // Don't forget to close the driver connection when you're finished with it
      await driver.close()
      await console.log("closed");

  }



//geting data from uni-assist
  async function coursesIDs() {
    return new Promise(async function (resolve, reject) {
      setTimeout(async function () {
        await axios(config)
          .then(async function (response) {
            let some = response.data.data.list[0].list;
            await some.map((data) => {
              coursesID.push(`${data.id}`);
              coursesDetails.push(data);
              // createDB(`${data.id}`);
            });
          })
          .catch(function (error) {
            console.log(error);
          })
          .finally((e) => {
            console.log("1 completed");
          });
        resolve();
      }, 3000);
    });
  }


//getting data from db.
  async function readDB() {
    const neo4j = require('neo4j-driver')
    
    const uri = 'url of neo4j';
      const user = 'user id';
      const password = 'pass';
    
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
    const session = driver.session()

    try {
      const readQuery = `MATCH p = (CourseID) return CourseID.ID`
                         
      const readResult = await session.readTransaction(tx =>
        tx.run(readQuery)
      )
      // console.log(readResult.records);
      readResult.records.forEach(record => {
        record._fields.map(some => {
          // console.log();
          array.push(`${some}`)
        })
      })
    //   readResult
    } catch (error) {
      console.error('Something went wrong: ', error)
    } finally {
      await session.close();
      console.log("2 completed")
    }
   
    // Don't forget to close the driver connection when you're finished with it
    await driver.close()
  }  
  

let samevar = [];

async function getAllData(data) {

  await data.map((some) => {
    coursesDetails.map((somes) =>{
      // console.log( some + `${somes.id}`);
      if(some === `${somes.id}`) {
        // console.log(`${somes.id}`);
        let {studienfachName,hochschuleName,zulassungstypHoeheresFsName} = somes;
        
        let sos = [studienfachName,hochschuleName,zulassungstypHoeheresFsName];
        let sss = sos.join(" || "); 
        samevar.push(
          sss
          // "description":somes.infotext,
          // "semester": somes.semesterName,
          // "collegename":somes.hochschuleName,
          // "location":somes.standortName,
          // "admissiontype":somes.zulassungstypHoeheresFsName
        );
      }
    })
  })
}

let arrayHtml = [];
async function displayDatas(datas){
  // console.log(datas);
  await datas.map(some => {
    
    arrayHtml.push(`<p>Hi,</p>
    <p>Uni-assist new courses added</p>
    <p>${Date()}</p>
    <p>Details</p>
    <table border="1" cellspacing="3" cellpadding="0">
    <tbody>
    <tr>
    <th>subject name</th>
    <th>semester</th>
    <th>collegename</th>
    <th>location</th>
    <th>description</th>
    <th>admissiontype</th>
    </tr>
    <tr>
    <td>
    <p><strong>${some.subjectname}</strong></p>
    </td>
    <td>
    <p><strong>${some.semester}</strong></p>
    </td>
    <td>
    <p><strong>${some.collegename}</strong></p>
    </td>
    <td>
    <p><strong>${some.location}</strong></p>
    </td>
    <td>
    <p><strong>${some.description}</strong></p>
    </td>
    <td>
    <p><strong>${some.admissiontype}</strong></p>
    </td>
    </tr>
    </tbody>
    </table>`) 
  })
}

//email
async function main(data) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: "emailid", // generated email user
      pass: "pass", // generated email password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Uni-assist "<emailid>', // sender address
    to: "emailid", // list of receivers
    subject: "New courses added to uni-assist", // Subject line
    //html: data, // html body
    text: `New added uniassist courses. \n\n ${data}`
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
}


// MATCH (CourseID {ID: '160627'})
// DELETE CourseID

// let arraydelete = [
//   '160702', '160624', '160627', '160705', '160621',
//   '160708', '160714', '160639', '160630', '160645',
//    '160717', '160720', '160684', '160723', '160633',
//    '160657', '160726', '160693', '160897', '160729',
//   '160663', '160732', '160894', '160735', '160738',
//    '160660', '160750', '160666', '160741', '160744',
//    '160651', '160753', '160759', '160762', '160858',
//    '160711', '160861', '160756', '160636', '160864',
//    '160642', '160768', '160699', '160867', '160687',
//    '160855', '160696', '160669', '160870', '160873',
//   '160876', '160672', '160879', '160690', '160885',
//  '160882', '160765', '160888', '160678', '160681',
//  '160747', '160654', '160648', '160891'
// ]

// async function createDB(data) {
//   const neo4j = require('neo4j-driver')
      
//       const uri = 'neo4j+s://6ca24c8e.databases.neo4j.io';
//       const user = 'neo4j';
//       const password = 'aeVWyKqjPO_zrOdcvRzczbVMKludb6K4W6Rf2hj10ro';
      
//       const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
//       const session = driver.session()
     
//       const person1Name = data;
      
//       try {
//         const readQuery = `MATCH (CourseID {ID: $person1Name }) DELETE CourseID`
                           
//         const writeResult = await session.writeTransaction(tx =>
//           tx.run(readQuery, { person1Name })
//         )
//       //   writeResult
//       console.log("Data deleted");
//     //   writeResult.records.forEach(record => {
//     //    console.log(record);
//     //  })
//       //   readResult
//       } catch (error) {
//         console.error('Something went wrong: ', error)
//       } finally {
//         await session.close()
//       }
     
//       // Don't forget to close the driver connection when you're finished with it
//       await driver.close()
//   }
  

//   app.get("/addID", async (req, res) => {
//     //   await coursesIDs()
    
    
//     await arraydelete.map(async(e) => {
//       // console.log(e);
//       await createDB(e);
//     })


//     });

// 00 00 * * * once every day
//sending mail
 cron.schedule('05 * * * *',async function() {
  
  console.log('---------------------');
  console.log('Running Cron Job');
  
  await coursesIDs().then(readDB);
  //compare both db.
  let somesss = await coursesID.filter((x) => !array.includes(x));
  await console.log("last",somesss.length);
  if(somesss.length === 0) {
    console.log(somesss);
    console.log("No updates");
  } else {
    console.log(somesss);

    await getAllData(somesss)
    // .then(async() => {
    //   //  console.log(samevar);
    //   await displayDatas(samevar);
      
    // })
     .then(async() => {
      
      // console.log(arrayHtml);
     let so = await samevar.join("\n\n");
    //  console.log(so);
    await main(so);

    }).then(async() => {
      await somesss.map(async(s) => {
        // await console.log(s);
        await createDB(s)
      })
    }).catch((e) => {
      console.log(e);
    });
  }
    
  await console.log('---------------------');
  await console.log('Completed Cron Job');
});

app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});
