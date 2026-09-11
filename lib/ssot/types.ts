export const KNOWLEDGE_DOMAINS = [
  { code: "00_PROJECT", label: "Project" },
  { code: "01_BUSINESS_REQUIREMENT", label: "Business Requirement" },
  { code: "02_DATA_INVENTORY", label: "Data Inventory" },
  { code: "03_DATA_DICTIONARY", label: "Data Dictionary" },
  { code: "04_DATA_MAPPING", label: "Data Mapping" },
  { code: "05_CANONICAL_MODEL", label: "Canonical Model" },
  { code: "06_ONTOLOGY", label: "Ontology" },
  { code: "07_DATA_CONTRACT", label: "Data Contract" },
  { code: "08_SYSTEM_INVENTORY", label: "System / API" },
  { code: "09_WORKFLOW", label: "Workflow" },
  { code: "10_SAMPLE_DATA", label: "Sample Data" },
  { code: "11_DATA_PROFILING", label: "Data Profiling" },
  { code: "12_SECURITY", label: "Security" },
  { code: "13_GAP_AND_DECISION_LOG", label: "Gap & Decision Log" },
  { code: "14_ARCHITECTURE", label: "Architecture" },
] as const;

export type KnowledgeDomainCode = (typeof KNOWLEDGE_DOMAINS)[number]["code"];

export type KnowledgeKind = "FACT" | "INFERENCE" | "ASSUMPTION" | "UNKNOWN";

export type ProvenanceSource =
  | "customer_provided"
  | "user_entered"
  | "ai_generated"
  | "ai_inferred"
  | "user_modified"
  | "system_generated";

export type LifecycleStatus =
  | "DRAFT"
  | "AI_GENERATED"
  | "PENDING_REVIEW"
  | "USER_MODIFIED"
  | "VALIDATED"
  | "APPROVED"
  | "REJECTED"
  | "SUPERSEDED"
  | "DEPRECATED"
  | "ARCHIVED"
  | "ACTIVE";

export type DomainStatus = "ACTIVE" | "DEPRECATED" | "ARCHIVED";

export interface Provenance {
  source: ProvenanceSource;
  kind: KnowledgeKind;
  confidence: number;
  aiSuggestion: boolean;
  userApproved: boolean;
  lastModifiedBy: string;
  lastModifiedAt: string;
}

export interface SourceRef {
  inventoryAssetId?: string;
  sourceSystem?: string;
  sourceField?: string;
  fileName?: string;
  note?: string;
}

export interface VersionEntry {
  id: string;
  version: number;
  timestamp: string;
  actor: string;
  changeSource: ProvenanceSource;
  targetType: string;
  targetId: string;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
}

export interface ImpactItem {
  id: string;
  createdAt: string;
  changedType: string;
  changedId: string;
  changedLabel: string;
  affected: string[];
  acknowledged: boolean;
  regenerated: boolean;
}

export interface ProjectIdentity {
  name: string;
  code: string;
  customer: string;
  description: string;
  owner: string;
  status: LifecycleStatus;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  type: "primary" | "secondary" | "stakeholder";
  responsibilities: string;
}

export interface RequirementItem {
  id: string;
  category: "business" | "user" | "functional" | "non_functional" | "ai" | "story";
  statement: string;
  acceptanceCriteria: string;
  priority: "must" | "should" | "could";
}

export interface BusinessRequirement {
  objective: string;
  background: string;
  currentWorkflow: string;
  painPoints: string[];
  targetWorkflow: string;
  businessValue: string;
  kpis: string[];
  targetAudience: string;
  primaryUser: string;
  secondaryUser: string;
  personas: string[];
  stakeholders: Stakeholder[];
  requirements: RequirementItem[];
  mvp: string;
  inScope: string[];
  outOfScope: string[];
  futureScope: string[];
  businessConstraints: string[];
  technicalConstraints: string[];
  dataConstraints: string[];
  dependencies: string[];
  legalConstraints: string[];
  risks: string[];
  assumptions: string[];
  userFlow: string;
  keyInteractions: string[];
  screenRequirements: string;
  uxRequirements: string;
  figmaRefs: string[];
}

export interface InventoryAsset {
  id: string;
  domain: string;
  dataAsset: string;
  description: string;
  sourceSystem: string;
  dataOwner: string;
  format: string;
  volume: string;
  frequency: string;
  accessMethod: string;
  apiAvailability: string;
  required: boolean;
  status: DomainStatus | "ACTIVE" | "OPTIONAL" | "UNKNOWN";
  notes: string;
  fileName?: string;
  uploadedAt?: string;
  rowCount?: number;
  columns?: string[];
}

export interface DataInventory {
  assets: InventoryAsset[];
}

export interface DomainRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: DomainStatus;
  version: number;
  sourceAssetIds: string[];
  lineage: string;
  createdAt: string;
  updatedAt: string;
  history: VersionEntry[];
  affectedArtifacts: string[];
}

export interface DynamicDomainRegistry {
  domains: DomainRecord[];
  derivedFromInventoryVersion: number;
}

export interface DictionaryAttribute {
  id: string;
  domainId: string;
  name: string;
  label: string;
  description: string;
  dataType: string;
  sourceField: string;
  sourceSystem: string;
  sampleValues: string[];
  required: boolean;
  nullable: boolean;
  format?: string;
  semanticMeaning?: string;
  canonicalMapping?: string;
  synonyms: string[];
  provenance: Provenance;
  status: LifecycleStatus;
  sourceRefs: SourceRef[];
}

export interface DictionaryTable {
  domainId: string;
  domainName: string;
  attributes: DictionaryAttribute[];
}

export interface DataDictionary {
  tables: DictionaryTable[];
}

export interface ProfileColumn {
  name: string;
  inferredType: string;
  nullRate: number;
  distinctCount: number;
  min?: string;
  max?: string;
  samples: string[];
}

export interface ProfileResult {
  assetId: string;
  domain: string;
  rowCount: number;
  columns: ProfileColumn[];
  generatedAt: string;
}

export interface DataMappingRow {
  id: string;
  sourceDomain: string;
  sourceField: string;
  canonicalEntity: string;
  canonicalAttribute: string;
  transform: string;
  confidence: number;
  status: LifecycleStatus;
  sourceRefs: SourceRef[];
}

export interface CanonicalAttribute {
  id: string;
  entityId: string;
  name: string;
  dataType: string;
  description: string;
  required: boolean;
  sourceMappings: string[];
  confidence: number;
  status: LifecycleStatus;
}

export interface CanonicalEntity {
  id: string;
  name: string;
  description: string;
  attributes: CanonicalAttribute[];
  status: LifecycleStatus;
}

export interface CanonicalModel {
  entities: CanonicalEntity[];
}

export interface OntologyAttribute {
  id: string;
  entityId: string;
  name: string;
  label: string;
  description: string;
  dataType: string;
  required: boolean;
  nullable: boolean;
  format?: string;
  unit?: string;
  sourceRefs: SourceRef[];
  canonicalRef?: string;
  synonyms: string[];
  confidence: number;
  provenance: Provenance;
  status: LifecycleStatus;
}

export interface OntologyEntity {
  id: string;
  name: string;
  label: string;
  description: string;
  type: "class" | "individual";
  parentEntityId?: string;
  attributes: OntologyAttribute[];
  sourceRefs: SourceRef[];
  canonicalRefs: string[];
  synonyms: string[];
  status: LifecycleStatus;
  metadata: Record<string, string>;
}

export interface OntologyRelationship {
  id: string;
  name: string;
  label: string;
  description: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: string;
  direction: "forward" | "bidirectional";
  cardinality: string;
  inverseRelationshipId?: string;
  sourceRefs: SourceRef[];
  confidence: number;
  provenance: Provenance;
  status: LifecycleStatus;
  metadata: Record<string, string>;
}

export interface ValidationIssue {
  id: string;
  entityId?: string;
  relationshipId?: string;
  attributeId?: string;
  severity: "error" | "warning" | "info";
  rule: string;
  message: string;
  resolutionStatus: "open" | "accepted" | "fixed";
}

export interface OntologyMetadata {
  ontologyId: string;
  version: number;
  status: LifecycleStatus;
  createdAt: string;
  updatedAt: string;
  provenance: Provenance;
}

export interface OntologyModel {
  entities: OntologyEntity[];
  relationships: OntologyRelationship[];
  metadata: OntologyMetadata;
  validationIssues: ValidationIssue[];
}

export interface DataContract {
  id: string;
  name: string;
  version: string;
  owner: string;
  canonicalEntityId: string;
  compatibility: string;
  qualityExpectations: string;
  fields: {
    name: string;
    dataType: string;
    required: boolean;
    nullable: boolean;
    format?: string;
    allowedValues?: string[];
    constraints?: string;
    dictionaryAttributeId?: string;
  }[];
  status: LifecycleStatus;
}

export interface ApiEndpoint {
  id: string;
  method: string;
  path: string;
  description: string;
  entityRef?: string;
}

export interface SystemRecord {
  id: string;
  name: string;
  type: string;
  description: string;
  owner: string;
  endpoints: ApiEndpoint[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  actor: string;
  description: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface SecurityNote {
  id: string;
  topic: string;
  classification: string;
  note: string;
}

export interface GapItem {
  id: string;
  title: string;
  description: string;
  decision?: string;
  status: "open" | "decided" | "deferred";
  createdAt: string;
}

export interface ArchitectureNotes {
  overview: string;
  patterns: string[];
  components: string[];
  integrations: string[];
  nfrs: string[];
}

export interface GeneratedDocument {
  id: string;
  kind: string;
  title: string;
  markdown: string;
  generatedAt: string;
  ssotVersion: number;
}

export interface ProjectSSOT {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  project: ProjectIdentity;
  business: BusinessRequirement;
  inventory: DataInventory;
  domainRegistry: DynamicDomainRegistry;
  dictionary: DataDictionary;
  mapping: DataMappingRow[];
  canonical: CanonicalModel;
  ontology: OntologyModel;
  contracts: DataContract[];
  systems: SystemRecord[];
  workflows: Workflow[];
  profiling: ProfileResult[];
  security: SecurityNote[];
  gapLog: GapItem[];
  architecture: ArchitectureNotes;
  versions: VersionEntry[];
  impactQueue: ImpactItem[];
  documents: GeneratedDocument[];
}

export function emptyBusiness(): BusinessRequirement {
  return {
    objective: "",
    background: "",
    currentWorkflow: "",
    painPoints: [],
    targetWorkflow: "",
    businessValue: "",
    kpis: [],
    targetAudience: "",
    primaryUser: "",
    secondaryUser: "",
    personas: [],
    stakeholders: [],
    requirements: [],
    mvp: "",
    inScope: [],
    outOfScope: [],
    futureScope: [],
    businessConstraints: [],
    technicalConstraints: [],
    dataConstraints: [],
    dependencies: [],
    legalConstraints: [],
    risks: [],
    assumptions: [],
    userFlow: "",
    keyInteractions: [],
    screenRequirements: "",
    uxRequirements: "",
    figmaRefs: [],
  };
}

export function emptyProvenance(
  source: ProvenanceSource,
  kind: KnowledgeKind,
  actor = "system",
): Provenance {
  return {
    source,
    kind,
    confidence: source === "customer_provided" ? 1 : 0.6,
    aiSuggestion: source === "ai_generated" || source === "ai_inferred",
    userApproved: false,
    lastModifiedBy: actor,
    lastModifiedAt: new Date().toISOString(),
  };
}

export function createEmptySSOT(partial?: {
  name?: string;
  customer?: string;
  description?: string;
  owner?: string;
}): ProjectSSOT {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  return {
    id,
    version: 1,
    createdAt: now,
    updatedAt: now,
    project: {
      name: partial?.name ?? "Untitled project",
      code: `PRJ-${id.slice(0, 8).toUpperCase()}`,
      customer: partial?.customer ?? "",
      description: partial?.description ?? "",
      owner: partial?.owner ?? "",
      status: "DRAFT",
    },
    business: emptyBusiness(),
    inventory: { assets: [] },
    domainRegistry: { domains: [], derivedFromInventoryVersion: 0 },
    dictionary: { tables: [] },
    mapping: [],
    canonical: { entities: [] },
    ontology: {
      entities: [],
      relationships: [],
      metadata: {
        ontologyId: crypto.randomUUID(),
        version: 1,
        status: "DRAFT",
        createdAt: now,
        updatedAt: now,
        provenance: emptyProvenance("system_generated", "FACT"),
      },
      validationIssues: [],
    },
    contracts: [],
    systems: [],
    workflows: [],
    profiling: [],
    security: [],
    gapLog: [],
    architecture: {
      overview: "",
      patterns: [],
      components: [],
      integrations: [],
      nfrs: [],
    },
    versions: [],
    impactQueue: [],
    documents: [],
  };
}
