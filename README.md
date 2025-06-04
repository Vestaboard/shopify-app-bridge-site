# Shopify App Bridge for Vestaboard - Remix 2.7.x #

This repository contains [Shopify app](https://shopify.dev/docs/apps/getting-started) using the [Remix](https://remix.run) framework. Visit the [`shopify.dev` documentation](https://shopify.dev/docs/api/shopify-app-remix) for more details on the Remix app package.

**Site Environment**

Hosting for Shopify App Bridge for Vestaboard is provided by Amazon AWS Cloud.

Basic site environment:

- Nginx 1.26
- Node.js 20
- MySQL 8 (Amazon Aurora Serverless v2)


## Production Environment

### Deploying Changes To Production ###

Run the following at the command line to deploy to the web environment:

    eb deploy shopify-vestaboard-web

And ensure that Shopify is pointing to the correct production settings/URLs:

    https://partners.shopify.com/3089951/apps/55389388801/edit

You may be required to execute **eb init** if this is your first attempt to deploy the website to the 
Elastic Beanstalk server(s); instructions can be found further down in this document.

### Connecting Via SSH ###

Connect via SSH to a production server via a command such as:

    eb ssh shopify-vestaboard-web

You may be required to execute **eb ssh --setup** if this is your first attempt to
connect via SSH to the Elastic Beanstalk server(s).

### Files ###

The production website, worker and cron (scheduler) have a root folder of:

    /var/app/current/

### MySQL Database ###

The production website is configured to connect to the MySQL database:

    Host: vestaboard-installables.cluster-ci3gyg00w731.us-east-1.rds.amazonaws.com
    Username: root
    Password: ssOsumdOehpnnJPF
    Database: shopify_vestaboard_app_bridge


## Quick Start ##

### Prerequisites ###

Before you begin, you'll need the following:

1. **Node.js**: [Download and install](https://nodejs.org/en/download/) it if you haven't already.
2. **Shopify Partner Account**: [Create an account](https://partners.shopify.com/signup) if you don't have one.
3. **Test Store**: Set up either a [development store](https://help.shopify.com/en/partners/dashboard/development-stores#create-a-development-store) or a [Shopify Plus sandbox store](https://help.shopify.com/en/partners/dashboard/managing-stores/plus-sandbox-store) for testing your app.

### Setup ###

If you used the CLI to create the template, you can skip this section.

Using npm:

```shell
npm install
```

### Local Development ###

Using npm:

```shell
npm run dev
```

Press P to open the URL to your app. Once you click install, you can start development.

Local development is powered by [the Shopify CLI](https://shopify.dev/docs/apps/tools/cli). It logs into your partners account, connects to an app, provides environment variables, updates remote config, creates a tunnel and provides commands to generate extensions.

### Build ###

Remix handles building the app for you, by running the command below with the package manager of your choice:

Using npm:

```shell
npm run build
```

## Gotchas / Troubleshooting ##

### I Need To Modify The Shopify App Configuration Settings ###

Log in to the Shopify Partners backend and edit the settings at Build > Configuration:

    URL: https://vestaboard.atlassian.net/wiki/spaces/ED/pages/44531732/

### I Want To Start Development On A Local Webserver ###

First, make sure to switch to non-production Shopify app settings; run the command:

    npm run config:use local

This will make use of the settings file **shopify.app.local.toml**, which can be safely overwritten as needed (as 
opposed to **shopify.app.production.toml**). 

Next, boot up the self-contained local development webserver:

    npm run dev -- --config=local

### I Need To Rebuild My Database Locally ###

To wipe and rebuild all tables in your local development environment, run the command:

    npm run prisma migrate dev

### Database Tables Don't Exist ###

If you get this error:

```
The table `main.Session` does not exist in the current database.
```

You need to create the database for Prisma. Run the `setup` script in `package.json` using your preferred package manager.

### OAuth Goes Into A Loop When I Change My App's Scopes ###

If you change your app's scopes and authentication goes into a loop and fails with a message from Shopify that it tried too many times, you might have forgotten to update your scopes with Shopify. To do that, you can run the `deploy` CLI command.

Using npm:

```shell
npm run deploy
```
### My Webhook Subscriptions Aren't Being Updated ###

This template registers webhooks after OAuth completes, using the `afterAuth` hook when calling `shopifyApp`.
The package calls that hook in 2 scenarios:

- After installing the app
- When an access token expires

During normal development, the app won't need to re-authenticate most of the time, so the subscriptions aren't updated.

To force your app to update the subscriptions, you can uninstall and reinstall it in your development store.
That will force the OAuth process and call the `afterAuth` hook.