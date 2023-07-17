const express = require("express");
const router = express.Router();
const Imap = require('imap');
const {simpleParser} = require('mailparser');

const { insertBellQuery } = require('../lib/query');
const { executeQuery } = require('../db');
const auth = require('../middleware/auth');

const idLength = 8;

var DATA = []

router.post('/inbox', auth, (req,res) => {

  //  let todos = req.app.db.get('todos').value();
  // await getEmails();

  try {
    var config_imap = {
      user: req.body.email,
      password: req.body.pwd,
      host: 'outlook.office365.com', //imap.gmail.com
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      box:['INBOX','SPAM']
    }
    const imap = new Imap(config_imap);
    imap.once('ready', () => {
      imap.openBox('INBOX', false, () => {
        imap.search(['ALL', ['SINCE', 'May 20, 2010']], (err, results) => {
          try {
            const f = imap.fetch(results, {bodies: ''});
            f.on('message', msg => {
              msg.on('body', stream => {
                DATA = []
                simpleParser(stream, async (err, parsed) => {
                  const {from, subject, textAsHtml, text} = parsed;
                  // console.log(parsed);
                  /* Make API call to save the data
                    Save the retrieved data into a database.
                    E.t.c
                  */
                    var email_date = new Date(parsed.date);

                    var today = new Date();
                    var diffMs = (today - email_date); // milliseconds between now & Christmas
                    var diffDays = Math.floor(diffMs / 86400000); // days
                    var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
                    var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
                    var str_diff = diffDays + " days, " + diffHrs + " hours, " + diffMins + " minutes ago";
                    if (diffDays > 0) {
                        str_diff = diffDays + " days ago";
                    }
                    else if (diffHrs > 0)
                    {
                        str_diff = diffHrs + " hours ago"
                    }
                    else {
                        str_diff = diffMins + " minutes ago";
                    }
                    DATA.push(
                      {
                        id: parsed.messageId,
                        sender: parsed.from.text,
                        senderValue: parsed.from.value,
                        to: parsed.to.text,
                        toValue: parsed.to.value,
                        time: str_diff,
                        sentTime: parsed.date,
                        title: parsed.subject,
                        html: parsed.html,
                        textAsHtml: parsed.textAsHtml,
                        desc: parsed.text,
                        hasAttachment: parsed.attachments != null && parsed.attachments.length > 0,
                        attachments: parsed.attachments,
                        unread: false
                      }
                    )
                });
                
              });
              msg.once('attributes', attrs => {
                const {uid} = attrs;
                // imap.addFlags(uid, ['\\Seen'], () => {
                //   // Mark the email as read after reading it
                //   console.log('Marked as read!');
                // });
              });
            });
            f.once('error', ex => {
              return Promise.reject(ex);
            });
            f.once('end', () => {
              console.log('Done fetching all messages!');
              imap.end();
            });
          } catch (errorWhileFetching) {
            if (errorWhileFetching.message === 'Nothing to fetch') {
                console.log('no mails fetched, temp directory not created');
                imap.end();
            }
            else imap.end();
          }
        });
      });
    });

    imap.once('error', err => {
      console.log(err);
    });

    imap.once('end', () => {
      console.log('Connection ended');
      DATA.sort((b, a) => (new Date(a.sentTime) > new Date(b.sentTime)) ? 1 : ((new Date(b.sentTime) > new Date(a.sentTime)) ? -1 : 0))
      return res.send({"success": true, "data": DATA
                   });
    });

    imap.connect();
  } catch (ex) {
    console.log('an error occurred');
    return res.send({"success": true, "data": DATA
                   });
  }

});

router.post('/unseen', auth, (req,res) => {

    const userId = req.user.id;

  //  let todos = req.app.db.get('todos').value();
  // await getEmails();

  try {
    var config_imap = {
      user: req.body.email,
      password: req.body.pwd,
      host: 'outlook.office365.com', //imap.gmail.com
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      box:['INBOX','SPAM']
    }
    const imap = new Imap(config_imap);
    imap.once('ready', () => {
      imap.openBox('INBOX', false, () => {
        imap.search(['UNSEEN', ['SINCE', new Date()]], (err, results) => {
          try {
            const f = imap.fetch(results, {bodies: ''});
            f.on('message', msg => {
              msg.on('body', stream => {
                DATA = []
                simpleParser(stream, async (err, parsed) => {
                  const {from, subject, textAsHtml, text} = parsed;
                  // console.log(parsed);
                  /* Make API call to save the data
                    Save the retrieved data into a database.
                    E.t.c
                  */
                    var email_date = new Date(parsed.date);

                    var today = new Date();
                    var diffMs = (today - email_date); // milliseconds between now & Christmas
                    var diffDays = Math.floor(diffMs / 86400000); // days
                    var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
                    var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
                    var str_diff = diffDays + " days, " + diffHrs + " hours, " + diffMins + " minutes ago";
                    if (diffDays > 0) {
                        str_diff = diffDays + " days ago";
                    }
                    else if (diffHrs > 0)
                    {
                        str_diff = diffHrs + " hours ago"
                    }
                    else {
                        str_diff = diffMins + " minutes ago";
                    }
                    DATA.push(
                      {
                        id: parsed.messageId,
                        sender: parsed.from.text,
                        senderValue: parsed.from.value,
                        to: parsed.to.text,
                        toValue: parsed.to.value,
                        time: str_diff,
                        sentTime: parsed.date,
                        title: parsed.subject,
                        html: parsed.html,
                        textAsHtml: parsed.textAsHtml,
                        desc: parsed.text,
                        hasAttachment: parsed.attachments != null && parsed.attachments.length > 0,
                        attachments: parsed.attachments,
                        unread: true
                      }
                    )

                    await executeQuery(insertBellQuery, [userId, 'envelope', parsed.subject, 1]);

                });
                
              });
              msg.once('attributes', attrs => {
                const {uid} = attrs;
                // imap.addFlags(uid, ['\\Seen'], () => {
                //   // Mark the email as read after reading it
                //   console.log('Marked as read!');
                // });
              });
            });
            f.once('error', ex => {
              return Promise.reject(ex);
            });
            f.once('end', () => {
              console.log('Done fetching all messages!');
              imap.end();
            });
          } catch (errorWhileFetching) {
            if (errorWhileFetching.message === 'Nothing to fetch') {
                console.log('no mails fetched, temp directory not created');
                imap.end();
            }
            else {
              imap.end();
            }
          }
        });
      });
    });

    imap.once('error', err => {
      console.log(">>>>>>>>>>>>>>>>", err);
    });

    imap.once('end', () => {
      console.log('Connection ended');
      DATA.sort((b, a) => (new Date(a.sentTime) > new Date(b.sentTime)) ? 1 : ((new Date(b.sentTime) > new Date(a.sentTime)) ? -1 : 0))
      return res.send({"success": true, "data": DATA
                   });
    });

    imap.connect();
  } catch (ex) {
    console.log('an error occurred');
    return res.send({"success": true, "data": DATA
                   });
  }

});

router.get('/dashboard', (req, res) => {
  return res.send({"success": true, "data": {
          klantvragen: Math.round(Math.random() * 100),
          bestelling: Math.round(Math.random() * 100),
          retouren: Math.round(Math.random() * 100),
          beoordelingen: Math.round(Math.random() * 100),
          annoiem: Math.round(Math.random() * 100),
          jan_man: Math.round(Math.random() * 100),
          annuleringenL: Math.round(Math.random() * 100),
          op: Math.round(Math.random() * 100),
          trace: Math.round(Math.random() * 100),
      }
  });
});

router.get('/', (req,res) => {

    return res.send({
        message: "Welcome! Server",
        title: "Test"
    });

});


module.exports = router;