# DrillPhish

* Author: [Jonathan M. Wilbur](https://jonathan.wilbur.space) <[jonathan@wilbur.space](mailto:jonathan@wilbur.space)>
* Copyright Year: 2018
* License: [MIT License](https://mit-license.org/)
* Version: _See `version` file or git tags._

DrillPhish is a minimal JavaScript library for making phishing drill pages.
It watches selected username and password fields for user input, then reports
the victim falling for it to a given webhook and either redirects the user
to a page of your choice, or displays a popup, without letting them finish
typing in their credentials.

## Features

- Highly configurable, yet simple.
- Easy to deploy.
- Configurable webhooks, which allow you to receive detailed reports on user
  interaction with your phishing drill page.
- Secure by blocking user inputs after they have "fallen for it," and clearing
  those inputs.
- Redirects to a page of your choice upon user failure.
- Resistant to specious replay messages as users navigate back to the original
  page.
- Records unique user IDs in persistent storage to enhance non-repudiation.

## Usage

### Docker / Docker-Compose

The best way to deploy DrillPhish is to do so in the Docker container built
from the `Dockerfile` in this repository, and with Docker Compose for
orchestration. To get started, run the following command:

```bash
git clone https://github.com/JonathanWilbur/drillphish
```

Then, with Docker and Docker-Compose installed, run:

```
docker-compose up
```

This will start up the "PhishBook" test page. To bring it down, just press
`Ctrl-C`.

To host your own phishing site, you will have to mount your own static files
in `/usr/share/nginx/html` via the `docker-compose.yml` file. You will also
want to configure the environment variables to your liking, though they come
with sensible defaults.

The `<meta>` tags of the phishing page should have the following line added,
or an equivalent:

```html
<script src="/drillphish.min.js"></script>
```

The exact path you use will depend on where you keep `drillphish.min.js`.

### Direct Hosting

You do not _need_ Docker or Docker-Compose to use DrillPhish, however. You
can manually edit the settings at the top of `./dist/drillphish.js` and include
that file in your webpage for the same effect. 

## Building

Run `npm install` to install all of the development dependencies.

To build `./dist/drillphish.js`, run `tsc`.

To build `./dist/drillphish.min.js`, run `webpack`.

## ToDo

- [ ] Support OAuth 2.0 authentication for webhooks
- [ ] ~~Implement WebAssembly Build~~ _I cannot figure out how to get console symbols to work and other problems.~~
- [ ] Create usage GIF
- [ ] Create AWS API Gateway + Lambda Webhook Example
- [ ] Create Azure Example
- [ ] Create GCE Example
- [ ] Document everything
    - [ ] Docker setup

## Contact Me

If you would like to suggest fixes or improvements on this library, please just
[leave an issue on this GitHub page](https://github.com/JonathanWilbur/drillphish/issues). If you would like to contact me for other reasons,
please email me at [jonathan@wilbur.space](mailto:jonathan@wilbur.space)
([My GPG Key](https://jonathan.wilbur.space/downloads/jonathan@wilbur.space.gpg.pub))
([My TLS Certificate](https://jonathan.wilbur.space/downloads/jonathan@wilbur.space.chain.pem)). :boar: