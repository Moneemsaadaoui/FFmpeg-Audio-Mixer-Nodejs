const express = require("express");
const fileUpload = require("express-fileupload");
var ffmpeg = require("ffmpeg");
const uuidv1 = require("uuid/v1");
const app = express();
var Spinner = require("cli-spinner").Spinner;

// default options
app.use(fileUpload());
var uuid = "";
app.post("/upload", async function(req, res) {
  if (Object.keys(req.files).length == 0) {
    return res
      .status(400)
      .send("Failed to fetch the file, storage running out of space maybe ?.");
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.sampleFile;
  uuid = uuidv1();
  // Let's rename the file to this..
  sampleFile.mv("testfile.mp3", function(err) {
    try {
      var process = new ffmpeg("testfile.mp3");
      process.then(function(video) {
        console.log("The audio is ready to be processed");
        console.time("conv");
        console.log("Merging files ... ");

        var spinner = new Spinner("processing.. %s");
       spinner.setSpinnerString(".oO°Oo.");

        spinner.start();

        video.addCommand(
          "-i",
          'NIN.mp3 -filter_complex  "[0:0][1:0] amix=inputs=2:duration=longest" -ac 2 -c:a libmp3lame -qscale:a 5 -q:a 4 '
        ); //Merging the audio sources
        video.save(uuid + ".mp3", err => {
          console.timeEnd("conv");
          if (err) {
            console.log(err);
          } else console.log("done");
          console.log("transcoding to AAC & MP3")
          var transcode = new ffmpeg(uuid + ".mp3");
          transcode.then(function(audio) {
            audio.addCommand("-c:a aac");
            audio.save(uuid + ".aac", err => {
              spinner.stop()
              console.log('\r\n'+uuid+"mp3/aac successfully mixed and transcoded \n listening");

              res.sendFile(__dirname + "/" + uuid + ".aac");
            });
          });
        }),
          function(err) {
            console.log("done");
            console.log("Error: " + err);
          };
      });
    } catch (e) {
      console.log(e.code);
      console.log(e.msg);
    }

    if (err) return res.status(500).send(err);

    console.log("File uploaded!");
  });
});
const port = 9000
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
