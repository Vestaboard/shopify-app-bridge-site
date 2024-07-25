import { useEffect, useCallback, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  TextField
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { PrismaClient } from '@prisma/client'
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // Set up a default ShopifyStore object to return.
  let obj_shopify_store_record = {
    shop: null,
    authToken: null,
    isAuthorized: false,
  };

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

  // Query our MySQL database; returns an object or null.
  const prisma = new PrismaClient();
  const getShopifyStore: object | null = await prisma.ShopifyStore.findUnique({
    where: {
      shop: shop_domain,
    },
  });
  if ( getShopifyStore != null ) {
    obj_shopify_store_record.shop = getShopifyStore.shop;
    obj_shopify_store_record.authToken = getShopifyStore.authToken;
    obj_shopify_store_record.isAuthorized = getShopifyStore.isAuthorized;
  }

  return json({ obj_shopify_store_record });
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  // Use our loader and the Prisma ORM to look for a MySQL record for this store; based on the response,
  // display the Authorization Code form or the simplified Settings page.
  const { obj_shopify_store_record } = useLoaderData();
  if ( obj_shopify_store_record.isAuthorized == false ) {
    const [formState, setFormState] = useState({});
    const [authorizationCodeErrorState, setAuthorizationCodeErrorState] = useState(false);

    return (
      <Page>
        <TitleBar title="Setup: Your Authorization Code" />
        <BlockStack gap="500">
          <Layout>
            <Layout.Section>
              <Card>
                <Form action="/app/linkstore" method="post">
                  <BlockStack gap="500">
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        Setup: Your Authorization Code
                      </Text>

                      <Text as="p" variant="bodyMd">
                        To get started, make sure you've installed the{" "}
                        <Link url="https://web.vestaboard.com/marketplace-listing/9e5d78ae-bf14-46dd-bca9-60f43d9ee0fa/install?deeplink" target="_blank" removeUnderline>Shopify Stats channel</Link>{" "}
                        on your Vestaboard. Once it's installed, you'll be provide with a 6-character Authorization Code to enter into the field below. 
                      </Text>

                      <TextField label="Authorization Code" name="auth_code" value={formState.auth_code} onChange={(value) => setFormState({ ...formState, auth_code: value })} autoComplete="off" error={authorizationCodeErrorState} />
                    </BlockStack>
                    <InlineStack gap="300">
                      <Button submit={true}>
                        Submit Authorization Code
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </Form>
              </Card>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </Page>
    );
  }
  else {
    return (
      <Page>
        <TitleBar title="Settings" />
        <BlockStack gap="500">
          <Layout>
            <Layout.Section>
              <Card>
                <Form action="/app/settings" method="post">
                  <BlockStack gap="500">
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        Settings
                      </Text>

                      <Text as="p" variant="bodyMd">
                        You're all set up!
                      </Text>
                    </BlockStack>
                    <InlineStack gap="300">
                      <Button submit={true}>
                        Save Settings
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </Form>
              </Card>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </Page>
    );
  }
}
