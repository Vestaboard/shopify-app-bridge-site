import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
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

  // Call our Vestaboard Installables Shopify API and provide the shop_domain and auth_code values.
  // Reference: https://stackoverflow.com/questions/50046841/proper-way-to-make-api-fetch-post-with-async-await
  let str_url_vestaboard_installables = process.env.INSTALLABLES_API_DOMAIN + "/api/shopify/unlink-store";
  const obj_settings_vestaboard_installables = {
      method: 'POST',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      }, 
      body: JSON.stringify({ 'shop_name': shop_domain, }), 
  };
  let res_vestaboard_installables = await fetch(str_url_vestaboard_installables, obj_settings_vestaboard_installables);
  const obj_vestaboard_installables_response = await res_vestaboard_installables.json();

  // Prepare the JSON to be returned to the front-end from this server handler.
  var loaderData: LoaderData = {
    success: false,
    page_title: "Disconnect Store",
    message: "We've disconnected this Shopify store from the Vestaboard smart display.",
    button_title: "Return To Settings",
  };

  return json(loaderData);
};

export default function DisconnectStore() {
  let navigate = useNavigate();

  const obj_action_response = useLoaderData();

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
