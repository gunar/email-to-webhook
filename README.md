# @gunar/email-to-webhook

Receive emails and forward them to REST APIs.

## Setting up the server

Choosing a provider (that you trust), Vultr, Greenhost, OVH, Hetzner, Linode, Cockbox (make sure the host allows post 25 to be used, some providers block it).

With Vultr you may need to open a support ticket and request for them to unblock port 25.

Before starting you will want to check the IP of your new server to make sure it is not on any blacklists - https://multirbl.valli.org/lookup/

If it's, destroy it and deploy a new one. Some providers such as Vultr have entire ranges of IPs listed.

You should have a fresh 18.04 Ubuntu server. I'm assuming that you have taken proper steps to secure the server (no root login, key auth only, 2FA, automatic security updates etc.).

Add Fail2ban, a Firewall (e.g UFW), make sure that ports 25, 22 (or whatever your SSH port is if you've changed it) 443 and 80 are open.

A good place to get started - https://github.com/imthenachoman/How-To-Secure-A-Linux-Server

https://jacyhong.wordpress.com/2016/06/27/my-first-10-minutes-on-a-server-primer-for-securing-ubuntu/

https://plusbryan.com/my-first-5-minutes-on-a-server-or-essential-security-for-linux-servers

I will be running all commands as a sudo user called `johndoe`. The domain used will be `example.com` and the hostname `mail.example.com`. I'll be using Vultr for this example (Note: if you also use Vultr for managing DNS records they do not currently support TSLA records required for DANE).

To check your server's hostname run:

```bash
hostname -f
```

If your hostname is not what it should be update it by running:

```bash
sudo hostnamectl set-hostname mail.example.com
```

Making sure to replace mail.example.com with your own domain.

## DNS records

Now let's add some basic DNS records.

We'll start with the MX record. This tells email sent to your domain where it should go.

```
MX @ mail.example.com
```

We want to direct it to our server's fully qualified domain name (FQDN). Give it a priority of 10 (or just make sure it has the lowest priority if you have other MX records).

If you want to use wildcard subdomains e.g. (alias@username.example.com) then you also need to add a wildcard MX record:

```
MX * mail.example.com
```

This will tell email sent to any subdomain of example.com to go to the same place.

Add a wildcard A and AAAA (if using IPv6) record too if you want to use all subdomains (or just an A record for unsubscribe.example.com if not).

```
A * <Your-IPv4-address>
AAAA * <Your-IPv4-address>
```

If you want to just use the example.com domain and not bother with subdomains then you can skip the wildcard MX, A, AAAA records above (you will still need to add one for unsubscribe.example.com though to handle deactivating aliases).

Next we will add an explicit A record for the hostname `mail.example.com` and for where the web app will be located `app.example.com`

```
A mail.example.com <Your-IPv4-address>
A app.example.com <Your-IPv4-address>
```

If you are using IPv6 then you will also need to add an AAAA record

```
AAAA mail.example.com <Your-IPv6-address>
AAAA app.example.com <Your-IPv6-address>
```

Make sure to replace the placeholders above with the actual IP address of your server.

Now we need to set up the correct PTR record for reverse DNS lookups. This needs to be set as your FQDN (fully qualified domain name) which in our case is mail.example.com.

On your server run `host <Your-IPv4-address>` to check what it is.

You will likely need to login to your hosting provider to update your PTR record.

In Vultr you can update your reverse DNS by clicking on your server, then going to the settings tab, then IPv4 and click on the value in the "Reverse DNS" column.

Change it to `mail.example.com`. Don't forget to update this for IPv6 if you are using it too.

## Installing email-to-webhook

Create an npm project:
```
npm init --yes
```

Install `@gunar/email-to-webhook`:
```
npm install --save @gunar/email-to-webhook 
```

Create `index.js`:
```js
const emailToWebhook = require('@gunar/email-to-webhook');

const server = emailToWebhook.createServer({
hostname: 'destination.com',
path: '/webhook'
});

// Listen on Port 25 (SMTP)
server.listen(25);
```
Run server the server:
```
node index.js
```

Use [swaks](http://jetmore.org/john/code/swaks/) to send a mock email and test our mail server:

```sh
$ swaks -h destination.com -f from-this@email.com -t to-this@destination.com -s destination.com -p 25
```

If everything works, you should get a POST request at `https://destination.com/webhook`.


### Parsing the Post Data

I recommend using `mailparser` as such:
```js
const simpleParser = require("mailparser").simpleParser;

export default async (req, res) => {
  const parsed = await simpleParser(req);
  console.log(parsed)
  res.status(200).send('OK');
};
```
