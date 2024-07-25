import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Get the form data submitted on this page.
  let formData = await request.formData();
  formData = Object.fromEntries(formData);

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
  let auth_code = formData.auth_code;

  // Call our Vestaboard Installables Shopify API and provide the shop_domain and auth_code values.
  // Reference: https://stackoverflow.com/questions/50046841/proper-way-to-make-api-fetch-post-with-async-await
  let str_url_vestaboard_installables = process.env.INSTALLABLES_API_DOMAIN + "/api/shopify/link-store";
  const settings = {
      method: 'POST',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      }, 
      body: JSON.stringify({ 'shop_name': shop_domain, 'auth_code': auth_code }), 
  };
  let res_vestaboard_installables = await fetch(str_url_vestaboard_installables, settings);
  const obj_vestaboard_installables_response = await res_vestaboard_installables.json();

  return json(obj_vestaboard_installables_response);
};

export default function LinkStore() {
  const obj_vestaboard_installables_response = useActionData<typeof action>();
  console.log(obj_vestaboard_installables_response);

  return (
    <Page>
      <TitleBar title="Additional page" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="p" variant="bodyMd">
                The app template comes with an additional page which
                demonstrates how to create multiple pages within app navigation
                using{" "}
                <Link
                  url="https://shopify.dev/docs/apps/tools/app-bridge"
                  target="_blank"
                  removeUnderline
                >
                  App Bridge
                </Link>
                .
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Resources
              </Text>
              <List>
                <List.Item>
                  <Link
                    url="https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav"
                    target="_blank"
                    removeUnderline
                  >
                    App nav best practices
                  </Link>
                </List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
