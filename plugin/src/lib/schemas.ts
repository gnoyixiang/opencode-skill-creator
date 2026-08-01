export interface Assertion {
  type: "contains" | "regex" | "json_schema" | "file_exists" | "file_contains";
  value: string;
  path?: string;
}

export interface EvalCase {
  id: string;
  prompt: string;
  input_files?: string[];
  assertions: Assertion[];
}

export interface EvalSuite {
  skill_name: string;
  evals: EvalCase[];
}

export interface EvalMetadata {
  eval_id: string;
  eval_name: string;
  prompt: string;
  assertions: Assertion[];
}

export interface GradingEntry {
  text: string;
  passed: boolean;
  evidence: string;
}

export interface GradingResult {
  eval_id: string;
  total_assertions: number;
  passed_assertions: number;
  entries: GradingEntry[];
}

export interface TimingData {
  start_ms: number;
  end_ms: number;
  duration_ms: number;
}

export interface BenchmarkConfig {
  skill_name: string;
  iteration: number;
  evals: BenchmarkEvalResult[];
}

export interface BenchmarkEvalResult {
  eval_id: string;
  eval_name: string;
  with_skill: {
    passed: number;
    total: number;
    pass_rate: number;
    duration_ms: number;
  };
  without_skill: {
    passed: number;
    total: number;
    pass_rate: number;
    duration_ms: number;
  };
  delta: {
    pass_rate: number;
    duration_ms: number;
  };
}

export interface BenchmarkSummary {
  overall_pass_rate_with: number;
  overall_pass_rate_without: number;
  avg_duration_with: number;
  avg_duration_without: number;
  total_evals: number;
}

export const SUPPORTED_ASSERTION_TYPES = ["contains", "regex", "json_schema", "file_exists", "file_contains"] as const;
