/**
 * App bundle manifest — the declarative contract a marketplace app ships.
 *
 * A bundle is real files on disk (manifest.json + schemas/pages/automations/assets),
 * but instead of executing arbitrary vendor JS it is *provisioned* into the existing
 * dynamic runtime (SchemaRegistry + PageRegistry + AutomationRule), so it runs at
 * /app/<slug>/<page-slug> via the DynamicFormRenderer.
 */

export interface ManifestField {
  name: string;
  label?: string;
  type: string; // text | textarea | number | date | select | boolean | reference | ...
  required?: boolean;
  options?: any[];
  [k: string]: any;
}

export interface ManifestSchema {
  slug: string; // entity slug, unique within the app
  name: string;
  description?: string;
  fields: ManifestField[];
  settings?: Record<string, any>;
  /** Seed rows inserted as CustomRecords on install (only when the schema is empty). */
  sampleData?: Record<string, any>[];
}

export interface ManifestPage {
  slug: string; // url segment under /app/<appSlug>/
  title: string;
  type?: 'form' | 'list' | 'dashboard' | 'report' | 'custom';
  schema?: string; // references a ManifestSchema.slug (the backing entity)
  layout?: any; // for custom pages
  module?: string; // owning module slug (set when flattened from a ManifestModule)
}

/**
 * A sub-module of an industry app (e.g. "Appointments" inside "Healthcare").
 * Modules can be enabled/disabled per tenant from the app's in-app admin console
 * without uninstalling the app.
 */
export interface ManifestModule {
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  enabledByDefault?: boolean;
  roles?: string[]; // suggested RBAC roles for this module (shown in admin console)
  schemas?: ManifestSchema[];
  pages?: ManifestPage[];
  automations?: ManifestAutomation[];
}

export interface ManifestAutomation {
  name: string;
  trigger: Record<string, any>;
  actions: any[];
  enabled?: boolean;
}

/**
 * Out-of-process service section (runtime: 'declarative+service'). The service
 * lives in its own repo/deployment; core proxies /api/v1/ext/<routePrefix>/* to
 * it while the app is installed. See @unerp/service-kit for the shared contract.
 */
export interface ManifestService {
  routePrefix?: string; // defaults to the app slug
  baseUrlEnv?: string; // env var core reads for the service base URL
  defaultBaseUrl?: string; // fallback (e.g. docker-compose hostname)
  healthcheck: string; // path on the service, e.g. /svc/health
  scopes?: string[];
  timeoutMs?: number;
  /** Core domain events this app subscribes to (delivered as signed webhooks). */
  events?: { event: string; deliverTo: string }[];
}

export interface ManifestAsset {
  path: string; // relative path inside the bundle, e.g. "assets/logo.png"
  contentBase64?: string;
  content?: string; // text asset
}

export interface AppManifest {
  name: string;
  slug: string;
  version: string; // semver
  category: string;
  vendor: string; // vendor slug
  runtime: 'declarative' | 'declarative+service';
  /** Contract version between bundle and core (see EXT_API_VERSION). */
  apiVersion?: number;
  /** Minimum core semver this bundle requires; install refuses older cores. */
  minCoreVersion?: string;
  /** Required when runtime is 'declarative+service'. */
  service?: ManifestService;
  /**
   * When set, this bundle *extends* an existing app instead of creating a new
   * /app/<slug> shell: its pages are provisioned under the target app's module
   * and grouped as submodule sections in that app's sidebar (App Studio).
   */
  targetApp?: string;
  description?: string;
  longDescription?: string;
  icon?: string;
  pricing?: 'FREE' | 'PAID' | 'FREEMIUM';
  price?: number;
  tags?: string[];
  screenshots?: { url: string; caption?: string }[];
  requiresApps?: string[]; // prerequisite app slugs
  configSchema?: Record<string, any>;
  modules?: ManifestModule[]; // industry-app sub-modules (toggleable)
  schemas?: ManifestSchema[];
  pages?: ManifestPage[];
  automations?: ManifestAutomation[];
  assets?: ManifestAsset[];
}

const SEMVER = /^\d+\.\d+\.\d+([-+].+)?$/;
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

/**
 * Validates a manifest. Throws an Error with a readable message on the first
 * problem found — install/publish refuse invalid bundles.
 */
export function validateManifest(manifest: any): AppManifest {
  if (!manifest || typeof manifest !== 'object') throw new Error('Manifest is missing or not an object');

  const req = (k: string) => {
    if (!manifest[k]) throw new Error(`Manifest missing required field "${k}"`);
  };
  ['name', 'slug', 'version', 'category', 'vendor'].forEach(req);

  if (!SLUG.test(manifest.slug)) throw new Error(`Invalid app slug "${manifest.slug}" (use lowercase letters, numbers, hyphens)`);
  if (!SEMVER.test(manifest.version)) throw new Error(`Invalid version "${manifest.version}" (expected semver like 1.0.0)`);
  const SUPPORTED_RUNTIMES = ['declarative', 'declarative+service'];
  if (manifest.runtime && !SUPPORTED_RUNTIMES.includes(manifest.runtime)) {
    throw new Error(`Unsupported runtime "${manifest.runtime}" (supported: ${SUPPORTED_RUNTIMES.join(', ')})`);
  }
  const SUPPORTED_API_VERSION = 1;
  if (manifest.apiVersion !== undefined && (typeof manifest.apiVersion !== 'number' || manifest.apiVersion > SUPPORTED_API_VERSION)) {
    throw new Error(`Manifest apiVersion ${manifest.apiVersion} is not supported by this core (max ${SUPPORTED_API_VERSION})`);
  }
  if (manifest.runtime === 'declarative+service') {
    const svc = manifest.service;
    if (!svc || typeof svc !== 'object') throw new Error('runtime "declarative+service" requires a "service" section');
    if (!svc.healthcheck || typeof svc.healthcheck !== 'string' || !svc.healthcheck.startsWith('/')) {
      throw new Error('service.healthcheck must be an absolute path like "/svc/health"');
    }
    if (svc.routePrefix && !SLUG.test(svc.routePrefix)) {
      throw new Error(`Invalid service.routePrefix "${svc.routePrefix}" (use lowercase letters, numbers, hyphens)`);
    }
    if (svc.events !== undefined) {
      if (!Array.isArray(svc.events)) throw new Error('service.events must be an array');
      for (const e of svc.events) {
        if (!e?.event || typeof e.event !== 'string') throw new Error('each service.events entry needs an "event" name');
        if (!e?.deliverTo || typeof e.deliverTo !== 'string' || !e.deliverTo.startsWith('/')) {
          throw new Error(`service.events "${e?.event}" needs a "deliverTo" path starting with /`);
        }
      }
    }
  } else if (manifest.service) {
    throw new Error('Manifest declares a "service" section but runtime is not "declarative+service"');
  }
  if (manifest.targetApp && !SLUG.test(manifest.targetApp)) {
    throw new Error(`Invalid targetApp slug "${manifest.targetApp}" (use lowercase letters, numbers, hyphens)`);
  }
  if (manifest.minCoreVersion !== undefined && !SEMVER.test(manifest.minCoreVersion)) {
    throw new Error(`Invalid minCoreVersion "${manifest.minCoreVersion}" (expected semver like 2.1.0)`);
  }

  // Flatten any modules into combined schemas/pages, tagging each page with its
  // owning module so the runtime + admin console can group and toggle them.
  const modules: ManifestModule[] = Array.isArray(manifest.modules) ? manifest.modules : [];
  const schemas: ManifestSchema[] = [...(Array.isArray(manifest.schemas) ? manifest.schemas : [])];
  const pages: ManifestPage[] = [...(Array.isArray(manifest.pages) ? manifest.pages : [])];
  const moduleSlugs = new Set<string>();
  const normalizedModules: ManifestModule[] = [];
  for (const m of modules) {
    if (!m.slug || !SLUG.test(m.slug)) throw new Error(`Module has invalid slug "${m?.slug}"`);
    if (moduleSlugs.has(m.slug)) throw new Error(`Duplicate module slug "${m.slug}"`);
    moduleSlugs.add(m.slug);
    for (const s of m.schemas || []) schemas.push(s);
    for (const p of m.pages || []) pages.push({ ...p, module: m.slug });
    if (Array.isArray(m.automations)) manifest.automations = [...(manifest.automations || []), ...m.automations];
    normalizedModules.push({
      slug: m.slug, name: m.name, description: m.description, icon: m.icon,
      enabledByDefault: m.enabledByDefault !== false, roles: m.roles || [],
    });
  }

  const schemaSlugs = new Set<string>();
  for (const s of schemas) {
    if (!s.slug || !SLUG.test(s.slug)) throw new Error(`Schema has invalid slug "${s?.slug}"`);
    if (schemaSlugs.has(s.slug)) throw new Error(`Duplicate schema slug "${s.slug}"`);
    if (!Array.isArray(s.fields)) throw new Error(`Schema "${s.slug}" must have a fields array`);
    schemaSlugs.add(s.slug);
  }

  const pageSlugs = new Set<string>();
  for (const p of pages) {
    if (!p.slug || !SLUG.test(p.slug)) throw new Error(`Page has invalid slug "${p?.slug}"`);
    if (pageSlugs.has(p.slug)) throw new Error(`Duplicate page slug "${p.slug}"`);
    if (p.schema && !schemaSlugs.has(p.schema)) {
      throw new Error(`Page "${p.slug}" references unknown schema "${p.schema}"`);
    }
    pageSlugs.add(p.slug);
  }

  // Service-backed bundles may ship zero declarative pages (API-only extension).
  if (pages.length === 0 && manifest.runtime !== 'declarative+service') {
    throw new Error('Manifest must declare at least one page');
  }

  return {
    ...manifest,
    runtime: manifest.runtime === 'declarative+service' ? 'declarative+service' : 'declarative',
    modules: normalizedModules,
    schemas,
    pages,
    automations: Array.isArray(manifest.automations) ? manifest.automations : [],
    assets: Array.isArray(manifest.assets) ? manifest.assets : [],
  } as AppManifest;
}
