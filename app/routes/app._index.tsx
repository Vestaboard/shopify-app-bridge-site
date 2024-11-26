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
//import { getSessionTokenHeader, getSessionTokenFromUrlParam } from '@shopify/app-bridge-remix';
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

    //console.log('app._index.tsx::Index(): obj_additional_options = ' + obj_shopify_store_record.additionalOptions);

    if ( typeof obj_additional_options.interval_update_secs == 'undefined' ) {
      obj_additional_options.interval_update_secs = '86400';
      obj_additional_options.arr_specific_times = '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"12\",\"minutes\":\"00\",\"amPm\":\"AM\"}}]';
    }
    if ( obj_additional_options.interval_update_secs == '86400' ) {
      if ( typeof obj_additional_options.arr_specific_times != 'undefined' ) {
        var arr_specific_times = JSON.parse(obj_additional_options.arr_specific_times);
        if ( arr_specific_times.length == 0 ) {
          obj_additional_options.arr_specific_times = '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"12\",\"minutes\":\"00\",\"amPm\":\"AM\"}}]';
        }
      }
      else {
        obj_additional_options.arr_specific_times = '[{\"label\":\"Time\",\"index\":0,\"time\":{\"hour\":\"12\",\"minutes\":\"00\",\"amPm\":\"AM\"}}]';
      }
      if ( typeof obj_additional_options.interval_starting_at_time == 'undefined' ) {
        obj_additional_options.interval_starting_at_time = '00:00';
      }
      if ( typeof obj_additional_options.interval_ending_at_time == 'undefined' ) {
        obj_additional_options.interval_ending_at_time = '00:00';
      }
    }
    else {
      obj_additional_options.arr_specific_times = '[]';
      if ( typeof obj_additional_options.interval_starting_at_time == 'undefined' ) {
        obj_additional_options.interval_starting_at_time = '10:00';
      }
      if ( typeof obj_additional_options.interval_ending_at_time == 'undefined' ) {
        obj_additional_options.interval_ending_at_time = '18:00';
      }
    }

    const [formState, setFormState] = useState({});
    const [authorizationCodeErrorState, setAuthorizationCodeErrorState] = useState(false);

    // Form settings values
    const [salesSummaryTodayValue, setSalesSummaryTodayValue] = useState((obj_additional_options.display_daily_progress == '1') ? true : false);
    const [salesSummaryWeekValue, setSalesSummaryWeekValue] = useState((obj_additional_options.display_week_to_date_progress == '1') ? true : false);
    const [salesSummaryMonthValue, setSalesSummaryMonthValue] = useState((obj_additional_options.display_month_to_date_progress == '1') ? true : false);
    const [salesSummaryYearValue, setSalesSummaryYearValue] = useState((obj_additional_options.display_year_to_date_progress == '1') ? true : false);
    const [intervalValue, setIntervalValue] = useState(obj_additional_options.interval_update_secs);
    const [startAtValue, setStartAtValue] = useState(obj_additional_options.interval_starting_at_time);
    const [startAtHourValue, setStartAtHourValue] = useState(obj_additional_options.interval_starting_at_time_hour);
    const [startAtMinuteValue, setStartAtMinuteValue] = useState(obj_additional_options.interval_starting_at_time_minute);
    const [startAtAnteValue, setStartAtAnteValue] = useState(obj_additional_options.interval_starting_at_time_ante);
    const [endAtValue, setEndAtValue] = useState(obj_additional_options.interval_ending_at_time);
    const [endAtHourValue, setEndAtHourValue] = useState(obj_additional_options.interval_ending_at_time_hour);
    const [endAtMinuteValue, setEndAtMinuteValue] = useState(obj_additional_options.interval_ending_at_time_minute);
    const [endAtAnteValue, setEndAtAnteValue] = useState(obj_additional_options.interval_ending_at_time_ante);
    const [frequencyTimeValue, setFrequencyTimeValue] = useState(obj_additional_options.arr_specific_times);
    const [displayOrderPlacedValue, setDisplayOrderPlacedValue] = useState((obj_additional_options.display_order_placed == '1') ? true : false);
    const [titleValue, setTitleValue] = useState(obj_additional_options.option_title);

    const setTimeValueWithCheck = (timeType, fieldName, val) => {
      if ( timeType == 'startAt' ) {
        if ( fieldName == 'hour' ) {
          setStartAtHourValue(val);
        }
        if ( fieldName == 'minute' ) {
          setStartAtMinuteValue(val);
        }
        if ( fieldName == 'ante' ) {
          setStartAtAnteValue(val);
        }
      }

      if ( timeType == 'endAt' ) {
        if ( fieldName == 'hour' ) {
          setEndAtHourValue(val);
        }
        if ( fieldName == 'minute' ) {
          setEndAtMinuteValue(val);
        }
        if ( fieldName == 'ante' ) {
          setEndAtAnteValue(val);
        }
      }
    };

    const renderIntervalFields = () => {
      if ( intervalValue == '86400' ) {
        return (
          <>
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
          </>
        );
      }
      else {
        return (
          <>
            <InlineGrid gap="100" columns={2}>
              <InlineGrid gap="100" columns={3}>
                <Select
                  label="Start At"
                  options={[
                    {label: '12', value: '00'},
                    {label: '1', value: '01'},
                    {label: '2', value: '02'},
                    {label: '3', value: '03'},
                    {label: '4', value: '04'},
                    {label: '5', value: '05'},
                    {label: '6', value: '06'},
                    {label: '7', value: '07'},
                    {label: '8', value: '08'},
                    {label: '9', value: '09'},
                    {label: '10', value: '10'},
                    {label: '11', value: '11'},
                  ]}
                  onChange={(val) => setTimeValueWithCheck('startAt', 'hour', val)}
                  value={startAtHourValue}
                />

                <Select
                  label="&nbsp;"
                  options={[
                    { label: '00', value: '00' },
                    { label: '01', value: '01' },
                    { label: '02', value: '02' },
                    { label: '03', value: '03' },
                    { label: '04', value: '04' },
                    { label: '05', value: '05' },
                    { label: '06', value: '06' },
                    { label: '07', value: '07' },
                    { label: '08', value: '08' },
                    { label: '09', value: '09' },
                    { label: '10', value: '10' },
                    { label: '11', value: '11' },
                    { label: '12', value: '12' },
                    { label: '13', value: '13' },
                    { label: '14', value: '14' },
                    { label: '15', value: '15' },
                    { label: '16', value: '16' },
                    { label: '17', value: '17' },
                    { label: '18', value: '18' },
                    { label: '19', value: '19' },
                    { label: '20', value: '20' },
                    { label: '21', value: '21' },
                    { label: '22', value: '22' },
                    { label: '23', value: '23' },
                    { label: '24', value: '24' },
                    { label: '25', value: '25' },
                    { label: '26', value: '26' },
                    { label: '27', value: '27' },
                    { label: '28', value: '28' },
                    { label: '29', value: '29' },
                    { label: '30', value: '30' },
                    { label: '31', value: '31' },
                    { label: '32', value: '32' },
                    { label: '33', value: '33' },
                    { label: '34', value: '34' },
                    { label: '35', value: '35' },
                    { label: '36', value: '36' },
                    { label: '37', value: '37' },
                    { label: '38', value: '38' },
                    { label: '39', value: '39' },
                    { label: '40', value: '40' },
                    { label: '41', value: '41' },
                    { label: '42', value: '42' },
                    { label: '43', value: '43' },
                    { label: '44', value: '44' },
                    { label: '45', value: '45' },
                    { label: '46', value: '46' },
                    { label: '47', value: '47' },
                    { label: '48', value: '48' },
                    { label: '49', value: '49' },
                    { label: '50', value: '50' },
                    { label: '51', value: '51' },
                    { label: '52', value: '52' },
                    { label: '53', value: '53' },
                    { label: '54', value: '54' },
                    { label: '55', value: '55' },
                    { label: '56', value: '56' },
                    { label: '57', value: '57' },
                    { label: '58', value: '58' },
                    { label: '59', value: '59' },
                  ]}
                  onChange={(val) => setTimeValueWithCheck('startAt', 'minute', val)}
                  value={startAtMinuteValue}
                />

                <Select
                  label="&nbsp;"
                  options={[
                    {label: 'AM', value: 'AM'},
                    {label: 'PM', value: 'PM'},
                  ]}
                  onChange={(val) => setTimeValueWithCheck('startAt', 'ante', val)}
                  value={startAtAnteValue}
                />
              </InlineGrid>

              <InlineGrid gap="100" columns={3}>
                <Select
                  label="End At"
                  options={[
                    {label: '12', value: '00'},
                    {label: '1', value: '01'},
                    {label: '2', value: '02'},
                    {label: '3', value: '03'},
                    {label: '4', value: '04'},
                    {label: '5', value: '05'},
                    {label: '6', value: '06'},
                    {label: '7', value: '07'},
                    {label: '8', value: '08'},
                    {label: '9', value: '09'},
                    {label: '10', value: '10'},
                    {label: '11', value: '11'},
                  ]}
                  onChange={(val) => setTimeValueWithCheck('endAt', 'hour', val)}
                  value={endAtHourValue}
                />

                <Select
                  label="&nbsp;"
                  options={[
                    { label: '00', value: '00' },
                    { label: '01', value: '01' },
                    { label: '02', value: '02' },
                    { label: '03', value: '03' },
                    { label: '04', value: '04' },
                    { label: '05', value: '05' },
                    { label: '06', value: '06' },
                    { label: '07', value: '07' },
                    { label: '08', value: '08' },
                    { label: '09', value: '09' },
                    { label: '10', value: '10' },
                    { label: '11', value: '11' },
                    { label: '12', value: '12' },
                    { label: '13', value: '13' },
                    { label: '14', value: '14' },
                    { label: '15', value: '15' },
                    { label: '16', value: '16' },
                    { label: '17', value: '17' },
                    { label: '18', value: '18' },
                    { label: '19', value: '19' },
                    { label: '20', value: '20' },
                    { label: '21', value: '21' },
                    { label: '22', value: '22' },
                    { label: '23', value: '23' },
                    { label: '24', value: '24' },
                    { label: '25', value: '25' },
                    { label: '26', value: '26' },
                    { label: '27', value: '27' },
                    { label: '28', value: '28' },
                    { label: '29', value: '29' },
                    { label: '30', value: '30' },
                    { label: '31', value: '31' },
                    { label: '32', value: '32' },
                    { label: '33', value: '33' },
                    { label: '34', value: '34' },
                    { label: '35', value: '35' },
                    { label: '36', value: '36' },
                    { label: '37', value: '37' },
                    { label: '38', value: '38' },
                    { label: '39', value: '39' },
                    { label: '40', value: '40' },
                    { label: '41', value: '41' },
                    { label: '42', value: '42' },
                    { label: '43', value: '43' },
                    { label: '44', value: '44' },
                    { label: '45', value: '45' },
                    { label: '46', value: '46' },
                    { label: '47', value: '47' },
                    { label: '48', value: '48' },
                    { label: '49', value: '49' },
                    { label: '50', value: '50' },
                    { label: '51', value: '51' },
                    { label: '52', value: '52' },
                    { label: '53', value: '53' },
                    { label: '54', value: '54' },
                    { label: '55', value: '55' },
                    { label: '56', value: '56' },
                    { label: '57', value: '57' },
                    { label: '58', value: '58' },
                    { label: '59', value: '59' },
                  ]}
                  onChange={(val) => setTimeValueWithCheck('endAt', 'minute', val)}
                  value={endAtMinuteValue}
                />

                <Select
                  label="&nbsp;"
                  options={[
                    {label: 'AM', value: 'AM'},
                    {label: 'PM', value: 'PM'},
                  ]}
                  onChange={(val) => setTimeValueWithCheck('endAt', 'ante', val)}
                  value={endAtAnteValue}
                />
              </InlineGrid>
            </InlineGrid>
          </>
        );
      }
    };

    const handleClickSaveChanges = async () => {
      var str_body = "";
      const arr_body = [];
      arr_body.push("display_daily_progress" + "=" + ((salesSummaryTodayValue == true) ? '1' : '0'));
      arr_body.push("display_week_to_date_progress" + "=" + ((salesSummaryWeekValue == true) ? '1' : '0'));
      arr_body.push("display_month_to_date_progress" + "=" + ((salesSummaryMonthValue == true) ? '1' : '0'));
      arr_body.push("display_year_to_date_progress" + "=" + ((salesSummaryYearValue == true) ? '1' : '0'));
      arr_body.push("interval_update_secs" + "=" + intervalValue);
      if ( intervalValue == '86400' ) {
        arr_body.push("arr_specific_times" + "=" + frequencyTimeValue);        
        arr_body.push("interval_starting_at_time" + "=" + '00:00');
        arr_body.push("interval_ending_at_time" + "=" + '00:00');
      }
      else {
        var str_interval_starting_at_time = startAtHourValue + ':' + startAtMinuteValue;
        if ( startAtAnteValue == 'PM' ) {
          str_interval_starting_at_time = (parseInt(startAtHourValue) + 12) + ':' + startAtMinuteValue;
        }
        var str_interval_ending_at_time = endAtHourValue + ':' + endAtMinuteValue;
        if ( endAtAnteValue == 'PM' ) {
          str_interval_ending_at_time = (parseInt(endAtHourValue) + 12) + ':' + endAtMinuteValue;
        }
        arr_body.push("arr_specific_times" + "=" + '[]');        
        arr_body.push("interval_starting_at_time" + "=" + str_interval_starting_at_time);
        arr_body.push("interval_ending_at_time" + "=" + str_interval_ending_at_time);
      }
      arr_body.push("display_order_placed" + "=" + ((displayOrderPlacedValue == true) ? '1' : '0'));
      arr_body.push("option_title" + "=" + titleValue);
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
                        Choose the sales summaries you'd like to display on your Vestaboard by checking one or more of the options found below, and set a title for the messages.
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
                      <TextField label="Title" name="option_title" value={titleValue} onChange={setTitleValue} autoComplete="off" />
                    </BlockStack>

                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">
                        Next, choose how when you'd like these summaries to be displayed on your Vestaboard.
                      </Text>

                      <Select
                        label="Repeat Every"
                        options={[
                          {label: '15 Minutes', value: '900'},
                          {label: '30 Minutes', value: '1800'},
                          {label: 'Hour', value: '3600'},
                          {label: '2 Hours', value: '7200'},
                          {label: '4 Hours', value: '10800'},
                          {label: 'Day', value: '86400'},
                        ]}
                        onChange={setIntervalValue}
                        value={intervalValue}
                      />

                      {renderIntervalFields()}
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
                      Manage in Vestaboard App
                    </Text>

                    <Text as="p" variant="bodyMd">
                      Now that you're connected, you can also manage all of your display settings directly in the Vestaboard app.
                    </Text>
                  </BlockStack>
                  <InlineStack gap="300">
                    <Button variant="primary" tone="primary" onClick={() => window.open('https://web.vestaboard.com/marketplace-listing/9e5d78ae-bf14-46dd-bca9-60f43d9ee0fa/install?deeplink', '_blank')}>
                      Manage In App
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>

              <BlockStack gap="500">
                &nbsp;
              </BlockStack>

              <Card>
                <Form action="/app/linkstore" method="post">
                  <BlockStack gap="500">
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd">
                        Connect Another Vestaboard
                      </Text>

                      <Text as="p" variant="bodyMd">
                        This store can be connected to multiple Vestaboards. To do so, enter the Authorization Code for the additional Vestaboard below.
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

              <BlockStack gap="500">
                &nbsp;
              </BlockStack>

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
