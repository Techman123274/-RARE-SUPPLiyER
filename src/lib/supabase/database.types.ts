export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole =
  | "customer"
  | "admin"
  | "manager"
  | "inventory_manager"
  | "order_manager"
  | "marketing_manager";

export type ProductStatus = "draft" | "active" | "sold_out" | "archived";
export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export type DiscountType = "percent" | "fixed" | "free_shipping";
export type ItemRequestStatus =
  | "submitted"
  | "under_review"
  | "looking"
  | "found"
  | "available"
  | "unable_to_source"
  | "cancelled";
export type ItemRequestPriority = "low" | "normal" | "high" | "urgent";
export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden";
export type ModerationStatus = "pending" | "approved" | "rejected";
export type ReviewReportReason = "spam" | "offensive" | "fake" | "inappropriate" | "other";
export type NotificationEmailStatus = "queued" | "sent" | "failed" | "skipped";

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<{
        id: string;
        email: string | null;
        display_name: string | null;
        avatar_url: string | null;
        role: AppRole;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      }>;
      categories: Table<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        sort_order: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      }>;
      products: Table<{
        id: string;
        slug: string;
        sku: string;
        name: string;
        brand: string;
        category_id: string | null;
        list_price: number;
        sale_price: number | null;
        cost: number | null;
        condition: string;
        condition_details: string | null;
        description: string;
        featured: boolean;
        status: ProductStatus;
        seo_title: string | null;
        seo_description: string | null;
        internal_notes: string | null;
        created_at: string;
        updated_at: string;
      }>;
      product_images: Table<{
        id: string;
        product_id: string;
        storage_path: string;
        sort_order: number;
        is_primary: boolean;
        created_at: string;
      }>;
      product_sizes: Table<{
        id: string;
        product_id: string;
        size: string;
        quantity: number;
      }>;
      coupons: Table<{
        id: string;
        code: string;
        title: string;
        description: string;
        discount_type: DiscountType;
        amount: number;
        min_order: number | null;
        starts_at: string | null;
        expires_at: string | null;
        max_uses: number | null;
        max_uses_per_customer: number | null;
        usage_count: number;
        active: boolean;
        archived: boolean;
        created_at: string;
        updated_at: string;
      }>;
      coupon_products: Table<{ coupon_id: string; product_id: string }>;
      coupon_categories: Table<{ coupon_id: string; category_id: string }>;
      deals: Table<{
        id: string;
        name: string;
        description: string;
        discount_type: DiscountType;
        amount: number;
        min_order: number | null;
        starts_at: string | null;
        ends_at: string | null;
        active: boolean;
        created_at: string;
        updated_at: string;
      }>;
      deal_products: Table<{ deal_id: string; product_id: string }>;
      deal_categories: Table<{ deal_id: string; category_id: string }>;
      banners: Table<{
        id: string;
        title: string;
        description: string;
        image_path: string | null;
        cta_label: string | null;
        cta_href: string | null;
        starts_at: string | null;
        ends_at: string | null;
        active: boolean;
        sort_order: number;
        created_at: string;
        updated_at: string;
      }>;
      homepage_sections: Table<{
        id: string;
        key: string;
        title: string | null;
        enabled: boolean;
        sort_order: number;
        config: Json;
        updated_at: string;
      }>;
      site_settings: Table<{
        id: string;
        store_name: string;
        contact_email: string | null;
        instagram_url: string | null;
        tiktok_url: string | null;
        currency: string;
        shipping_flat: number;
        free_shipping_threshold: number | null;
        tax_rate: number;
        maintenance_mode: boolean;
        updated_at: string;
      }>;
      orders: Table<{
        id: string;
        order_number: string;
        user_id: string | null;
        email: string;
        status: OrderStatus;
        payment_status: string;
        subtotal: number;
        discount: number;
        shipping: number;
        tax: number;
        total: number;
        coupon_id: string | null;
        coupon_code: string | null;
        shipping_address: Json;
        notes: string | null;
        created_at: string;
        updated_at: string;
      }>;
      order_items: Table<{
        id: string;
        order_id: string;
        product_id: string | null;
        name: string;
        sku: string;
        size: string;
        quantity: number;
        unit_price: number;
        line_total: number;
      }>;
      wishlists: Table<{
        id: string;
        user_id: string;
        product_id: string;
        created_at: string;
      }>;
      carts: Table<{
        id: string;
        user_id: string;
        product_id: string;
        size: string;
        quantity: number;
        updated_at: string;
      }>;
      admin_activity: Table<{
        id: string;
        actor_id: string | null;
        action: string;
        entity_type: string;
        entity_id: string | null;
        summary: string;
        metadata: Json;
        created_at: string;
      }>;
      item_requests: Table<{
        id: string;
        user_id: string;
        product_name: string;
        brand: string;
        category: string;
        size: string | null;
        color: string | null;
        condition_preference: string;
        budget_min: number | null;
        budget_max: number | null;
        budget_text: string | null;
        details: string | null;
        status: ItemRequestStatus;
        priority: ItemRequestPriority;
        admin_response: string | null;
        assigned_to: string | null;
        linked_product_id: string | null;
        created_at: string;
        updated_at: string;
      }>;
      item_request_notes: Table<{
        id: string;
        request_id: string;
        author_id: string | null;
        body: string;
        created_at: string;
      }>;
      notifications: Table<{
        id: string;
        user_id: string;
        type: string;
        title: string;
        body: string;
        href: string | null;
        email_template: string | null;
        email_status: NotificationEmailStatus;
        email_sent_at: string | null;
        read_at: string | null;
        metadata: Json;
        created_at: string;
      }>;
      reviews: Table<{
        id: string;
        product_id: string;
        user_id: string;
        order_id: string | null;
        order_item_id: string | null;
        rating: number;
        title: string;
        body: string;
        size_purchased: string | null;
        status: ReviewStatus;
        verified_purchase: boolean;
        archived: boolean;
        created_at: string;
        updated_at: string;
      }>;
      review_images: Table<{
        id: string;
        review_id: string;
        storage_path: string;
        status: ModerationStatus;
        created_at: string;
      }>;
      review_reports: Table<{
        id: string;
        review_id: string;
        reporter_id: string;
        reason: ReviewReportReason;
        details: string | null;
        resolved: boolean;
        created_at: string;
      }>;
    };
    Views: {
      product_ratings: {
        Row: {
          product_id: string;
          average_rating: number;
          review_count: number;
          stars_5: number;
          stars_4: number;
          stars_3: number;
          stars_2: number;
          stars_1: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      admin_set_profile_role: {
        Args: { p_user_id: string; p_role: AppRole; p_is_active: boolean };
        Returns: undefined;
      };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      ensure_owner_admin: { Args: Record<string, never>; Returns: boolean };
      has_capability: { Args: { cap: string }; Returns: boolean };
      current_app_role: { Args: Record<string, never>; Returns: AppRole };
      staff_products: { Args: Record<string, never>; Returns: Database["public"]["Tables"]["products"]["Row"][] };
      staff_item_requests: { Args: Record<string, never>; Returns: Database["public"]["Tables"]["item_requests"]["Row"][] };
      cancel_my_item_request: { Args: { p_id: string }; Returns: undefined };
      admin_update_item_request: {
        Args: {
          p_id: string;
          p_status?: ItemRequestStatus | null;
          p_priority?: ItemRequestPriority | null;
          p_admin_response?: string | null;
          p_assigned_to?: string | null;
          p_linked_product_id?: string | null;
          p_clear_assignee?: boolean;
          p_clear_product?: boolean;
        };
        Returns: Database["public"]["Tables"]["item_requests"]["Row"];
      };
      admin_add_request_note: {
        Args: { p_request_id: string; p_body: string };
        Returns: Database["public"]["Tables"]["item_request_notes"]["Row"];
      };
      mark_notifications_read: { Args: { p_ids?: string[] | null }; Returns: undefined };
      admin_moderate_review: {
        Args: { p_id: string; p_status?: ReviewStatus | null; p_archived?: boolean | null };
        Returns: Database["public"]["Tables"]["reviews"]["Row"];
      };
      admin_moderate_review_image: {
        Args: { p_id: string; p_status: ModerationStatus };
        Returns: Database["public"]["Tables"]["review_images"]["Row"];
      };
      admin_resolve_review_report: { Args: { p_id: string; p_resolved?: boolean }; Returns: undefined };
      staff_review_stats: {
        Args: Record<string, never>;
        Returns: {
          average_rating: number | null;
          total_reviews: number;
          pending_reviews: number;
          reviews_this_month: number;
          reported_reviews: number;
        }[];
      };
      validate_coupon_amount: {
        Args: { p_code: string; p_subtotal: number; p_shipping: number; p_user_id?: string | null };
        Returns: { coupon_id: string | null; code: string; discount: number; message: string | null }[];
      };
      log_admin_activity: {
        Args: {
          p_action: string;
          p_entity_type: string;
          p_entity_id: string;
          p_summary: string;
          p_metadata?: Json;
        };
        Returns: undefined;
      };
      next_order_number: { Args: Record<string, never>; Returns: string };
    };
    Enums: {
      app_role: AppRole;
      product_status: ProductStatus;
      order_status: OrderStatus;
      discount_type: DiscountType;
      item_request_status: ItemRequestStatus;
      item_request_priority: ItemRequestPriority;
      review_status: ReviewStatus;
      moderation_status: ModerationStatus;
      review_report_reason: ReviewReportReason;
      notification_email_status: NotificationEmailStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type CouponRow = Database["public"]["Tables"]["coupons"]["Row"];
export type DealRow = Database["public"]["Tables"]["deals"]["Row"];
export type BannerRow = Database["public"]["Tables"]["banners"]["Row"];
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
export type AdminActivityRow = Database["public"]["Tables"]["admin_activity"]["Row"];
export type SiteSettingsRow = Database["public"]["Tables"]["site_settings"]["Row"];
export type ItemRequestRow = Database["public"]["Tables"]["item_requests"]["Row"];
export type ItemRequestNoteRow = Database["public"]["Tables"]["item_request_notes"]["Row"];
export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
export type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewImageRow = Database["public"]["Tables"]["review_images"]["Row"];
export type ReviewReportRow = Database["public"]["Tables"]["review_reports"]["Row"];
export type ProductRatingRow = Database["public"]["Views"]["product_ratings"]["Row"];
