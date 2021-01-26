# Perl-Websocket-Chat
A complete chat system that runs in the browser. Server side Perl websocket server fronted by apache2 proxy. Client side jQuery. With file uploads. Requires no user account or registration. Uses no cookies. Public and private one to one and one to many messages are possible, with auto URL linking, and image testing and embedding. 

## Requirements
* Perl Modules:
  * URI::Escape::XS
  * Encode
  * Config::Tiny
  * FindBin
  * UUID
  * Net::WebSocket::Server (but not the one from CPAN, use [this one](https://github.com/raymondsteers/perl-Net-WebSocket-Server)
    * Protocol::WebSocket (but not the one from CPAN, use [this one](https://github.com/raymondsteers/protocol-websocket)
  * File::Basename
  * CGI
* jQuery 1.11.3+
* jquery.mobile-1.4.5+
* freezeframe.js
* A modern browser that supports WebSockets
* Apache 2.x

## Config
* see [wss/example.pwsc.conf](https://github.com/raymondsteers/Perl-Websocket-Chat/blob/main/wss/example.pwsc.conf) comments for everything you need to know to configure both the websocket server and the upload.cgi script
* copy example.pwsc.conf to pwsc.conf before editing
* see [example.pwsc.apache2.conf](https://github.com/raymondsteers/Perl-Websocket-Chat/blob/main/example.pwsc.apache2.conf) for everything you need to know to set up your apache https virtual host
* copy example.pwsc.apache2.conf to your ```/etc/apache2/sites-available``` and create a symbolic link to the ```sites-enabled``` dir then restart apache (paths may differ on non-ubuntu servers)
* the port that the websocket server listens on MUST be the same port that your Apache Proxy BalancerMember is set to

## Running the Server
You will need to start up the websocket_server_pwsc process:
```
Usage:

	websocket_server_pwsc start

	websocket_server_pwsc stop

	websocket_server_pwsc run

	websocket_server_pwsc status (this will start a live log file tail which you can escape from using CRTL-C)

```
It's likely a good idea to use some linux server init script to keep it running and monitored as well. You should also have some monitoring for disk usage in your uploads dir or you might get your server filled up.

## Browser Clients
It works in Chrome on MacOS and on Android Chrome without issues. Should work pretty much everywhere else too. The CSS layout will adapt to screen size automatically. Mobile optimized.

## Screen Shots
These are taken from a fully functioning live URL:
![1](/examples/1.jpg?raw=true) ![2](/examples/2.jpg?raw=true) ![3](/examples/3.jpg?raw=true) ![4](/examples/4.jpg?raw=true) ![5](/examples/5.jpg?raw=true) ![6](/examples/6.jpg?raw=true) ![7](/examples/7.jpg?raw=true)

## Other Features
It is possible to have multiple websocket server processes listening on different ports all put into a proxy balancer pool, however this would require that some interprocess communication happens between them otherwise messages would get lost. If you want to know how to do this, please ask. I've done this on other systems using almost the same code.

## ToDo
* Peer to Peer WebRTC video and audio calling between 2 users, coordinated via websocket messages. Once the WebRTC connection is established there will be no server interaction
* theme changes
* rooms should be dynamically created instead of fixed
* private rooms
* audio/video file uploads and embedded players
* social sharing cards embedded
* message bubbles





