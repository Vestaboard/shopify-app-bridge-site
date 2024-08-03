import { useEffect, useCallback, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigate, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Checkbox,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineGrid,
  InlineStack,
  Select,
  TextField,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { getSessionTokenHeader, getSessionTokenFromUrlParam } from '@shopify/app-bridge-remix';
import { PrismaClient } from '@prisma/client'
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // Set up a default ShopifyStore object to return.
  let obj_shopify_store_record = {
    shop: null,
    isAuthorized: false,
    additionalOptions: '{}',
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

  // Call our Vestaboard Installables Shopify API and provide the shop_domain; see if there are settings to get back.
  // Reference: https://stackoverflow.com/questions/50046841/proper-way-to-make-api-fetch-post-with-async-await
  let str_url_vestaboard_installables = process.env.INSTALLABLES_API_DOMAIN + "/api/shopify/retrieve-store";
  const obj_settings_vestaboard_installables = {
      method: 'POST',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      }, 
      body: JSON.stringify({ 
        'shop_name': shop_domain, 
      }), 
  };
  let res_vestaboard_installables = await fetch(str_url_vestaboard_installables, obj_settings_vestaboard_installables);
  const obj_vestaboard_installables_response = await res_vestaboard_installables.json();

  //console.log(obj_vestaboard_installables_response);

  if ( obj_vestaboard_installables_response.success == 1 ) {
    obj_shopify_store_record.shop = shop_domain;
    obj_shopify_store_record.isAuthorized = true;
    obj_shopify_store_record.additionalOptions = obj_vestaboard_installables_response.additional_options;
  }

  return json({ obj_shopify_store_record });
};

export default function Index() {
  let navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  // Use our loader and the Prisma ORM to look for a MySQL record for this store; based on the response,
  // display the Authorization Code form or the simplified Settings page.
  const { obj_shopify_store_record } = useLoaderData();
  if ( obj_shopify_store_record.isAuthorized == true ) {
    const obj_additional_options = JSON.parse(obj_shopify_store_record.additionalOptions);
    var arr_specific_times = JSON.parse(obj_additional_options.arr_specific_times);
    if ( arr_specific_times.length == 0 ) {
      obj_additional_options.arr_specific_times = '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"12\",\"minutes\":\"00\",\"amPm\":\"AM\"}}]';
    }

    // Form settings values
    const [salesSummaryTodayValue, setSalesSummaryTodayValue] = useState((obj_additional_options.display_daily_progress == '1') ? true : false);
    const [salesSummaryWeekValue, setSalesSummaryWeekValue] = useState((obj_additional_options.display_week_to_date_progress == '1') ? true : false);
    const [salesSummaryMonthValue, setSalesSummaryMonthValue] = useState((obj_additional_options.display_month_to_date_progress == '1') ? true : false);
    const [salesSummaryYearValue, setSalesSummaryYearValue] = useState((obj_additional_options.display_year_to_date_progress == '1') ? true : false);
    const [frequencyTimeValue, setFrequencyTimeValue] = useState(obj_additional_options.arr_specific_times);
    const [displayOrderPlacedValue, setDisplayOrderPlacedValue] = useState((obj_additional_options.display_order_placed == '1') ? true : false);

    const handleClickSaveChanges = async () => {
      var str_body = "";
      const arr_body = [];
      arr_body.push("display_daily_progress" + "=" + ((salesSummaryTodayValue == true) ? '1' : '0'));
      arr_body.push("display_week_to_date_progress" + "=" + ((salesSummaryWeekValue == true) ? '1' : '0'));
      arr_body.push("display_month_to_date_progress" + "=" + ((salesSummaryMonthValue == true) ? '1' : '0'));
      arr_body.push("display_year_to_date_progress" + "=" + ((salesSummaryYearValue == true) ? '1' : '0'));
      arr_body.push("interval_update_secs" + "=" + '86400');
      arr_body.push("interval_starting_at_time" + "=" + '00:00');
      arr_body.push("interval_ending_at_time" + "=" + '00:00');
      arr_body.push("arr_specific_times" + "=" + frequencyTimeValue);
      arr_body.push("display_order_placed" + "=" + ((displayOrderPlacedValue == true) ? '1' : '0'));
      str_body = arr_body.join("&");

      const res = await fetch(`/app/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: str_body,
      });

      if (res.status === 200) {
        let responseJson = await res.json();
        if (responseJson.success == 1) {
          shopify.toast.show('Your settings were saved succesfully.');
        } 
        else {
          shopify.toast.show('Sorry, an error occurred. Please try again.');
        }
      } 
      else {
        shopify.toast.show('Sorry, an error occurred. Please try again.');
      }
    };

    return (
      <Page>
        <TitleBar title="Settings" />
        <BlockStack gap="500">
          <Layout>
            <Layout.Section>
              <Card>
                  <BlockStack gap="500">
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        To Date Summaries
                      </Text>

                      <Text as="p" variant="bodyMd">
                        Choose the sales summaries you'd like to display on your Vestaboard by checking one or more of the options found below.
                      </Text>

                      <InlineGrid gap="100" columns={4}>
                        <Checkbox
                          name="display_daily_progress" 
                          label="Today"
                          checked={salesSummaryTodayValue}
                          onChange={setSalesSummaryTodayValue}
                        />

                        <Checkbox
                          label="This Week"
                          checked={salesSummaryWeekValue}
                          onChange={setSalesSummaryWeekValue}
                        />

                        <Checkbox
                          label="This Month"
                          checked={salesSummaryMonthValue}
                          onChange={setSalesSummaryMonthValue}
                        />

                        <Checkbox
                          label="This Year"
                          checked={salesSummaryYearValue}
                          onChange={setSalesSummaryYearValue}
                        />
                      </InlineGrid>
                    </BlockStack>
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">
                        Next, choose how when you'd like these summaries to be displayed on your Vestaboard.
                      </Text>

                      <Select
                        label="Every Day At"
                        options={[
                          {label: '12:00 AM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"12\",\"minutes\":\"00\",\"amPm\":\"AM\"}}]'},
                          {label: '1:00 AM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"01\",\"minutes\":\"00\",\"amPm\":\"AM\"}}]'},
                          {label: '2:00 AM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"02\",\"minutes\":\"00\",\"amPm\":\"AM\"}}]'},
                          {label: '3:00 AM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"03\",\"minutes\":\"00\",\"amPm\":\"AM\"}}]'},
                          {label: '4:00 AM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"04\",\"minutes\":\"00\",\"amPm\":\"AM\"}}]'},
                          {label: '5:00 AM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"05\",\"minutes\":\"00\",\"amPm\":\"AM\"}}]'},
                          {label: '6:00 AM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"06\",\"minutes\":\"00\",\"amPm\":\"AM\"}}]'},
                          {label: '7:00 AM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"07\",\"minutes\":\"00\",\"amPm\":\"AM\"}}]'},
                          {label: '8:00 AM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"08\",\"minutes\":\"00\",\"amPm\":\"AM\"}}]'},
                          {label: '9:00 AM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"09\",\"minutes\":\"00\",\"amPm\":\"AM\"}}]'},
                          {label: '10:00 AM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"10\",\"minutes\":\"00\",\"amPm\":\"AM\"}}]'},
                          {label: '11:00 AM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"11\",\"minutes\":\"00\",\"amPm\":\"AM\"}}]'},
                          {label: '12:00 PM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"12\",\"minutes\":\"00\",\"amPm\":\"PM\"}}]'},
                          {label: '1:00 PM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"01\",\"minutes\":\"00\",\"amPm\":\"PM\"}}]'},
                          {label: '2:00 PM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"02\",\"minutes\":\"00\",\"amPm\":\"PM\"}}]'},
                          {label: '3:00 PM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"03\",\"minutes\":\"00\",\"amPm\":\"PM\"}}]'},
                          {label: '4:00 PM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"04\",\"minutes\":\"00\",\"amPm\":\"PM\"}}]'},
                          {label: '5:00 PM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"05\",\"minutes\":\"00\",\"amPm\":\"PM\"}}]'},
                          {label: '6:00 PM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"06\",\"minutes\":\"00\",\"amPm\":\"PM\"}}]'},
                          {label: '7:00 PM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"07\",\"minutes\":\"00\",\"amPm\":\"PM\"}}]'},
                          {label: '8:00 PM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"08\",\"minutes\":\"00\",\"amPm\":\"PM\"}}]'},
                          {label: '9:00 PM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"09\",\"minutes\":\"00\",\"amPm\":\"PM\"}}]'},
                          {label: '10:00 PM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"10\",\"minutes\":\"00\",\"amPm\":\"PM\"}}]'},
                          {label: '11:00 PM', value: '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"11\",\"minutes\":\"00\",\"amPm\":\"PM\"}}]'},
                        ]}
                        onChange={setFrequencyTimeValue}
                        value={frequencyTimeValue}
                      />
                    </BlockStack>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        Celebratory Message
                      </Text>

                      <Text as="p" variant="bodyMd">
                        If you'd like to get messages in real time when a new order is placed on your Shopify store, check the option below.
                      </Text>

                      <Checkbox
                        label="Receive messages about new orders"
                        checked={displayOrderPlacedValue}
                        onChange={setDisplayOrderPlacedValue}
                      />
                    </BlockStack>
                    <InlineStack gap="300">
                      <Button variant="primary" submit={false} onClick={() => handleClickSaveChanges()}>
                        Save Settings
                      </Button>
                    </InlineStack>
                  </BlockStack>
              </Card>
            </Layout.Section>
            <Layout.Section variant="oneThird">
              <Card>
                <BlockStack gap="500">
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      Disconnect From Vestaboard
                    </Text>

                    <Text as="p" variant="bodyMd">
                      Want to change or disconnect from the Vestaboard smart messaging display you're currently connected to? Press the button below and we'll reset your settings.
                    </Text>
                  </BlockStack>
                  <InlineStack gap="300">
                    <Button variant="primary" tone="critical" onClick={() => navigate("/app/disconnectstore")}>
                      Disconnect From Vestaboard
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </Page>
    );
  }
  else {
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
                        on your Vestaboard. Once it's installed, a 6-character Authorization Code will be displayed; enter that Authorization Code into the field below. 
                      </Text>

                      <TextField label="Authorization Code" name="auth_code" value={formState.auth_code} onChange={(value) => setFormState({ ...formState, auth_code: value })} autoComplete="off" error={authorizationCodeErrorState} />
                    </BlockStack>
                    <InlineStack gap="300">
                      <Button variant="primary" submit={true}>
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
}
