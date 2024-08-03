import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useNavigate } from "@remix-run/react";
import {
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Layout,
  Link,
  List,
  Page,
  Text,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Get the form data submitted on this page.
  let formData = await request.formData();
  formData = Object.fromEntries(formData);

  // Retrieve our Shopify app API key and secret from environment variables.
  let shopify_api_key = process.env.SHOPIFY_API_KEY;
  let shopify_api_secret = process.env.SHOPIFY_API_SECRET;

  //console.log('app.linkstore.tsx::action(): shopify_api_key = ' + shopify_api_key);
  //console.log('app.linkstore.tsx::action(): shopify_api_secret = ' + shopify_api_secret);

  // Get the auth_code value submitted by the user in the form.
  let auth_code = formData.auth_code;

  //console.log('app.linkstore.tsx::action(): auth_code = ' + auth_code);

  // Query Shopify's Admin GraphQL API and get back the shop_domain value we need.
  const { admin } = await authenticate.admin(request);
  let res_shopify_admin = await admin.graphql(
    `#graphql
      query {
        shop {
          myshopifyDomain
        }
      }`,
  );
  const obj_shopify_admin_response = await res_shopify_admin.json();
  let shop_domain = obj_shopify_admin_response.data.shop.myshopifyDomain;

  //console.log('app.linkstore.tsx::action(): shop_domain = ' + shop_domain);

  // Derive a 1-minute sessionToken from looking at code used in: /node_modules/@shopify/shopify-app-remix/dist/esm/server/authenticate/admin/authenticate.mjs
  const url = new URL(request.url);
  const headerSessionToken = url.searchParams.get('id_token');
  const searchParamSessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
  const sessionToken = (headerSessionToken || searchParamSessionToken);

  // Make a call to Shopify's OAuth Access Token API and exchange our session token for a 
  // long-living access token.
  // Reference: https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange
  let str_url_shopify_access_token = "https://" + shop_domain + "/admin/oauth/access_token";
  const obj_settings_shopify_access_token = {
      method: 'POST',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      }, 
      body: JSON.stringify({ 
        'client_id': shopify_api_key, 
        'client_secret': shopify_api_secret, 
        "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
        "subject_token": sessionToken,
        "subject_token_type": "urn:ietf:params:oauth:token-type:id_token",
        "requested_token_type": "urn:shopify:params:oauth:token-type:offline-access-token" 
      }), 
  };
  let res_shopify_access_token = await fetch(str_url_shopify_access_token, obj_settings_shopify_access_token);
  const obj_shopify_access_token_response = await res_shopify_access_token.json();
  let access_token = obj_shopify_access_token_response.access_token;

  //console.log('app.linkstore.tsx::action(): access_token = ' + access_token);

  // Call our Vestaboard Installables Shopify API and provide the shop_domain and auth_code values.
  // Reference: https://stackoverflow.com/questions/50046841/proper-way-to-make-api-fetch-post-with-async-await
  let str_url_vestaboard_installables = process.env.INSTALLABLES_API_DOMAIN + "/api/shopify/link-store";
  const obj_settings_vestaboard_installables = {
      method: 'POST',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      }, 
      body: JSON.stringify({ 'shop_name': shop_domain, 'access_token': access_token, 'auth_code': auth_code, }), 
  };
  let res_vestaboard_installables = await fetch(str_url_vestaboard_installables, obj_settings_vestaboard_installables);
  const obj_vestaboard_installables_response = await res_vestaboard_installables.json();

  // Prepare the JSON to be returned to the front-end from this server handler.
  var actionData: ActionData = {
    success: false,
    page_title: "Setup: An Error Occurred",
    message: "An unknown error occurred.",
    button_title: "Try Again",
  };
  if ( obj_vestaboard_installables_response.success != 1 ) {
    return json(actionData);
  }

  // Update our response object.
  actionData.success = true;
  actionData.page_title = 'Setup: Complete';
  actionData.message = "We've successfully connected to your Vestaboard. Next, click the button below and customize the settings to use to display data from this Shopify store on your Vestaboard smart display.";
  actionData.button_title = "Customize Settings";

  return json(actionData);
};

export default function LinkStore() {
  let navigate = useNavigate();

  var obj_action_response = {
    success: false,
    page_title: "FIXIT: Page Reload",
    message: "This message is displayed if this page has been refreshed without FORM data being POSTed to it. We need to fix this by requiring a FORM POST or redirecting back to /app .",
    button_title: "Try Again",
  }

  const actionData: ActionData | null | undefined = useActionData();
  if ( typeof actionData == 'undefined' ) {
    console.log('actionData is undefined, redirect back to /app !');
  }
  else {
    obj_action_response.success = actionData.success;
    obj_action_response.page_title = actionData.page_title;
    obj_action_response.message = actionData.message;
    obj_action_response.button_title = actionData.button_title;
  }

  return (
    <Page>
      <TitleBar title={obj_action_response.page_title} />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="p" variant="bodyMd">
                {obj_action_response.message}
              </Text>
              <InlineStack gap="300">
                <Button variant="primary" onClick={() => navigate("/app")}>
                  {obj_action_response.button_title}
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
