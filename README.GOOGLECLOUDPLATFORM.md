# Shopify App Bridge for Vestaboard - Remix 2.7.x #

This is a template for building a [Shopify app](https://shopify.dev/docs/apps/getting-started) using the [Remix](https://remix.run) framework.

Rather than cloning this repo, you can use your preferred package manager and the Shopify CLI with [these steps](https://shopify.dev/docs/apps/getting-started/create).

Visit the [`shopify.dev` documentation](https://shopify.dev/docs/api/shopify-app-remix) for more details on the Remix app package.

## Production Environment ##

### MySQL Database ###

The production website connects to a MySQL 8.0.18 database at: 

    Host: 10.67.80.3
    Port: 3306
    Username: root
    Password: ssOsumdOehpnnJPF
    Database: shopify_vestaboard_app_bridge

To connect to MySQL at the command line, first start the Google SQL Cloud Proxy (install 
if needed at https://cloud.google.com/sql/docs/mysql/sql-proxy ):
    
    cloud_sql_proxy --port 33306 vestaboard-installables:us-east1:vestaboard-installables

Then connect normally using the mysql CLI (note use of port 33306):
    
    mysql -h 127.0.0.1 -P 33306 -u root -pssOsumdOehpnnJPF -D shopify_vestaboard_app_bridge

### Connecting Via SSH ###

At present this is multiple steps:

1. First, get a list of GAE Flexible machine instances running by visiting App Engine > Instances, or the URL:

  * https://console.cloud.google.com/appengine/instances?serviceId=default&project=vestaboard-installables

2. Next, click the down arrow beside the SSH option and choose "View gcloud command". Copy and run the command on 
   your CLI.

3. Once SSHed into the GAE Flexible instance, run this CLI command to SSH into the Docker instance of the app:
      
      sudo docker exec -it gaeapp /bin/bash

You are now connected and inside the GAE app that was deployed. See the documentation at https://cloud.google.com/appengine/docs/flexible/debugging-an-instance 
for more information.

### Logging ###

Access and error logs can be found at:

    /var/log/nginx/

### Deploying ###

To deploy a new version of the site, run the command:

    gcloud app deploy

Next, ensure that Shopify is pointing to the correct production settings/URLs:

    npm run config:link

And instruct Shopify to update to those new production settings and create a new version:

    npm run deploy


## Quick Start ##

### Prerequisites

Before you begin, you'll need the following:

1. **Node.js**: [Download and install](https://nodejs.org/en/download/) it if you haven't already.
2. **Shopify Partner Account**: [Create an account](https://partners.shopify.com/signup) if you don't have one.
3. **Test Store**: Set up either a [development store](https://help.shopify.com/en/partners/dashboard/development-stores#create-a-development-store) or a [Shopify Plus sandbox store](https://help.shopify.com/en/partners/dashboard/managing-stores/plus-sandbox-store) for testing your app.

### Setup

If you used the CLI to create the template, you can skip this section.

Using npm:

```shell
npm install
```

### Local Development

Using npm:

```shell
npm run dev
```

Press P to open the URL to your app. Once you click install, you can start development.

Local development is powered by [the Shopify CLI](https://shopify.dev/docs/apps/tools/cli). It logs into your partners account, connects to an app, provides environment variables, updates remote config, creates a tunnel and provides commands to generate extensions.

### Build

Remix handles building the app for you, by running the command below with the package manager of your choice:

Using npm:

```shell
npm run build
```

## Gotchas / Troubleshooting

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
