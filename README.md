# hshs-robot-project

Web interface for a roving Raspberry Pi camera.

## What is it?

I don't like PHP, and so I decided to rewrite the [previous Raspberry Pi camera controller
web interface](http://www.elinux.org/RPi-Cam-Web-Interface) entirely in Node.js. 

This interface has authentication (more of an exercise than a rock-solid implementation) with
PostgreSQL and encrypted passwords, but no HTTPS, which pretty much defeats the point. It
also has logs, which rotate!

There are a few things this can't do, such as deal with capturing images/videos and
downloading them, but it's a bit more cleaner/snazzy *and full of bugs* because it was
made by a 15-year-old without unit tests.

## Installation/Implementation

If you want to download this thing for yourself, there's a few things you need from `npm`:

 * bcryptjs
 * body-parser
 * cookie-parser
 * debug
 * express
 * hbs
 * morgan
 * pg
 * serve-favicon

You'll also need [`raspimjpeg`](https://github.com/rpicopter/raspimjpeg) with some custom config 
(not done yet!).

There's also no handy-dandy install script, so you'll just need to plunk it in `/srv/http`
and hope for the best. I'll also need to supply some of my configuration files 
(`/etc/raspimjpeg`, `/etc/sudoers.d/hshs-robot-project` to name a few), so just consider
it "only works on one machine."

Obviously, you'll need a Raspberry Pi with a camera. We used the 
[Adafruit Motor HAT](https://www.adafruit.com/products/2348) as a DC motor controller.

The project isn't very flexible in terms of what it'll run on and configuration, but that
can always be fixed later. 