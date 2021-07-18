
# AXIA-CONNECT

<a href="https://user-images.githubusercontent.com/55819643/125511246-3ffdc59d-b90a-49f9-9378-1a157b8bb446.jpg"><img src="https://user-images.githubusercontent.com/55819643/125511246-3ffdc59d-b90a-49f9-9378-1a157b8bb446.jpg" height="400" width="400" ></a>

AXIA-CONNECT is a clone of MS Teams built under Microsoft Engage Mentorship 2021. It's main functionality is to connect users to each other through video conferencing. Agile methodology was followed while building this project.

## Sprints followed for making this project:

* First Week : Prepared a Design Document deciding on the Language and Technology to use for build.
* Second Week : Worked on building a simple 1-1 video conferencing WebApp and got to know about SDKs like Jitsi, OpenVidu.
* Third Week : Experimented with different SDKs and decided to add OpenVidu to my project. Successfully added Video Conferencing, Mute/Unmute functionality to the WebApp.
* Fourth and Final Week : Added Login/Logout Functionality, Screen Sharing, Chat Functionality and learnt to deploy the WebApp on Azure using a VM for the first time.

## Features:

* Join multiple users to a session with special code/name given by the person who initiates the meeting.
* Authentication using email and password making use of express-passport.
* Option of muting video/audio.
* Chat with other users in the session.
* Option to enter the session as a publisher or subscriber:
  * A publisher can show their video and audio.
  * A subscriber can only view what the publisher shows and chat during the session.

## Understanding how AXIA-CONNECT is built:

OpenVidu media server is used to built this WebApp. OpenVidu is a platform to facilitate the addition of video calls in web or mobile applications.WebRTC is the ultimate responsible for all media transmission at the very heart of OpenVidu. WebRTC is a modern, cross-platform framework that democratizes media transmission over the Internet. It is promoted by Google, Mozilla, Opera and others.Kurento is the WebRTC framework on which OpenVidu is built. 

Refer to the image given below for better understanding of the frontend backend
![image](https://user-images.githubusercontent.com/55819643/125513075-ac9d8028-79f2-4257-ab13-5f2e0f9f5ed1.png)

## Demo:

<a href="https://13.76.45.252:5000/">Axia-Connect</a> 

For this demo to work you will need to allow the site to show.

In another tab open this link, <a href="https://13.76.45.252/">Open Vidu</a>, and allow this page to be visible as well.

This will allow AXIA-CONNECT to connect with Open vidu and work accordingly.

## SetUp Instructions:

* Fork this repo and clone it.

* Run `npm install` to install all dependencies.

* Add a `.env` file and add this line :

  *`SESSION_SECRET=<your-session-secret>`

* Run `node server.js https://localhost:4443 MY_SECRET` on one terminal.

* Run `docker run -p 4443:4443 --rm -e OPENVIDU_SECRET=MY_SECRET openvidu/openvidu-server-kms:2.18.0` on another tab simultaneously.

Visit <a href="https://localhost:5000">https://localhost:5000</a> to see it working.

Visit <a href="https://localhost:4443">https://localhost:4443</a> to test the server.

### Thank You for reading so far. Hope this helped!


