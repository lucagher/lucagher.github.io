declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
  serve(handler: (req: Request) => Response | Promise<Response>): void
}

declare module 'https://esm.sh/@supabase/supabase-js@2?dts' {
  export type Json = Record<string, unknown>
  export interface SupabaseClientOptions<
    Database = never,
    SchemaName extends string & keyof Database = 'public'
  > {
    db?: {
      schema?: SchemaName
    }
  }

  export interface SupabaseClient<
    Database = never,
    SchemaName extends string & keyof Database = 'public'
  > {
    rpc<ReturnType = unknown>(
      fn: string,
      args?: Record<string, unknown>
    ): Promise<{ data: ReturnType | null; error: Error | null }>
  }

  export function createClient<
    Database = never,
    SchemaName extends string & keyof Database = 'public'
  >(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions<Database, SchemaName>
  ): SupabaseClient<Database, SchemaName>
}

