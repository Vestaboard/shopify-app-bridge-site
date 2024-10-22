import { json } from "@remix-run/node"; // or cloudflare/deno
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return json({});
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

  //console.log('app.settings.tsx::action(): shop_domain = ' + shop_domain);

  // Call our Vestaboard Installables Shopify API and provide the shop_domain and auth_code values.
  // Reference: https://stackoverflow.com/questions/50046841/proper-way-to-make-api-fetch-post-with-async-await
  let str_url_vestaboard_installables = process.env.INSTALLABLES_API_DOMAIN + "/api/shopify/settings-store";
  const obj_settings_vestaboard_installables = {
      method: 'POST',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      }, 
      body: JSON.stringify({ 
        'shop_name': shop_domain, 
        'display_daily_progress': formData.display_daily_progress, 
        'display_week_to_date_progress': formData.display_week_to_date_progress, 
        'display_month_to_date_progress': formData.display_month_to_date_progress, 
        'display_year_to_date_progress': formData.display_year_to_date_progress, 
        'interval_update_secs': formData.interval_update_secs, 
        'interval_starting_at_time': formData.interval_starting_at_time, 
        'interval_ending_at_time': formData.interval_ending_at_time, 
        'arr_specific_times': formData.arr_specific_times, 
        'display_order_placed': formData.display_order_placed, 
        'option_title': formData.option_title, 
      }), 
  };

  //console.log('app.settings.tsx::action(): obj_settings_vestaboard_installables.body = ' + obj_settings_vestaboard_installables.body);

  let res_vestaboard_installables = await fetch(str_url_vestaboard_installables, obj_settings_vestaboard_installables);
  const obj_vestaboard_installables_response = await res_vestaboard_installables.json();

  return json({ success: obj_vestaboard_installables_response.success });
};