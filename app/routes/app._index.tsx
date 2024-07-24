import { useEffect, useCallback, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, Form } from "@remix-run/react";
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
import { authenticate } from "../shopify.server";

// Reference: https://www.youtube.com/watch?v=dBI_F9C9kKI
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

// Reference: https://www.youtube.com/watch?v=WyGN5CT9iCs
export const action = async ({ request }: ActionFunctionArgs) => {
  let formData = await request.formData();

  formData = Object.fromEntries(formData);

  console.log(formData);

  return json(formData);
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const [formState, setFormState] = useState({});

  return (
    <Page>
      <TitleBar title="Setup: Your Authorization Code" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <Form method="POST">
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

                    <TextField label="Authorization Code" name="auth_code" value={formState.auth_code} onChange={(value) => setFormState({ ...formState, auth_code: value })} autoComplete="off" />
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
