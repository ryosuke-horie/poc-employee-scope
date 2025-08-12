import { ReviewBundle, Company, Evidence } from '@/types/review';

export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface CompanyDiff {
  company_id: number;
  type: DiffType;
  changes?: {
    name?: boolean;
    url?: boolean;
  };
}

export interface EvidenceDiff {
  company_id: number;
  evidence_index: number;
  type: DiffType;
  changes?: {
    value?: boolean;
    score?: boolean;
    source_type?: boolean;
    extraction_method?: boolean;
  };
}

export interface ReviewDiff {
  companies: CompanyDiff[];
  evidences: EvidenceDiff[];
  generated_at_changed: boolean;
}

/**
 * 2つのReviewBundle間の差分を検出
 */
export function detectDifferences(
  previous: ReviewBundle | null,
  current: ReviewBundle
): ReviewDiff {
  const diff: ReviewDiff = {
    companies: [],
    evidences: [],
    generated_at_changed: false,
  };

  if (!previous) {
    // 前回データがない場合、全て新規として扱う
    diff.companies = current.companies.map(c => ({
      company_id: c.id,
      type: 'added' as DiffType,
    }));
    
    current.evidence.forEach((e, index) => {
      diff.evidences.push({
        company_id: e.company_id,
        evidence_index: index,
        type: 'added' as DiffType,
      });
    });
    
    return diff;
  }

  // generated_atの変更をチェック
  diff.generated_at_changed = previous.generated_at !== current.generated_at;

  // 企業の差分を検出
  const prevCompanyMap = new Map(previous.companies.map(c => [c.id, c]));
  const currCompanyMap = new Map(current.companies.map(c => [c.id, c]));

  // 現在の企業をチェック
  current.companies.forEach(currCompany => {
    const prevCompany = prevCompanyMap.get(currCompany.id);
    
    if (!prevCompany) {
      // 新規追加
      diff.companies.push({
        company_id: currCompany.id,
        type: 'added',
      });
    } else {
      // 変更チェック
      const changes: CompanyDiff['changes'] = {};
      
      if (prevCompany.name !== currCompany.name) {
        changes.name = true;
      }
      if (prevCompany.url !== currCompany.url) {
        changes.url = true;
      }
      
      if (Object.keys(changes).length > 0) {
        diff.companies.push({
          company_id: currCompany.id,
          type: 'modified',
          changes,
        });
      } else {
        diff.companies.push({
          company_id: currCompany.id,
          type: 'unchanged',
        });
      }
    }
  });

  // 削除された企業をチェック
  previous.companies.forEach(prevCompany => {
    if (!currCompanyMap.has(prevCompany.id)) {
      diff.companies.push({
        company_id: prevCompany.id,
        type: 'removed',
      });
    }
  });

  // 証跡の差分を検出
  const prevEvidenceByCompany = new Map<number, Evidence[]>();
  const currEvidenceByCompany = new Map<number, Evidence[]>();

  previous.evidence.forEach(e => {
    if (!prevEvidenceByCompany.has(e.company_id)) {
      prevEvidenceByCompany.set(e.company_id, []);
    }
    prevEvidenceByCompany.get(e.company_id)!.push(e);
  });

  current.evidence.forEach(e => {
    if (!currEvidenceByCompany.has(e.company_id)) {
      currEvidenceByCompany.set(e.company_id, []);
    }
    currEvidenceByCompany.get(e.company_id)!.push(e);
  });

  // 各企業の証跡を比較
  currEvidenceByCompany.forEach((currEvidences, companyId) => {
    const prevEvidences = prevEvidenceByCompany.get(companyId) || [];
    
    currEvidences.forEach((currEvidence, index) => {
      // 同じインデックスの証跡と比較（簡易的な比較）
      const prevEvidence = prevEvidences[index];
      
      if (!prevEvidence) {
        // 新規追加
        diff.evidences.push({
          company_id: companyId,
          evidence_index: index,
          type: 'added',
        });
      } else {
        // 変更チェック
        const changes: EvidenceDiff['changes'] = {};
        
        if (prevEvidence.value !== currEvidence.value) {
          changes.value = true;
        }
        if (prevEvidence.score !== currEvidence.score) {
          changes.score = true;
        }
        if (prevEvidence.source_type !== currEvidence.source_type) {
          changes.source_type = true;
        }
        if (prevEvidence.extraction_method !== currEvidence.extraction_method) {
          changes.extraction_method = true;
        }
        
        if (Object.keys(changes).length > 0) {
          diff.evidences.push({
            company_id: companyId,
            evidence_index: index,
            type: 'modified',
            changes,
          });
        } else {
          diff.evidences.push({
            company_id: companyId,
            evidence_index: index,
            type: 'unchanged',
          });
        }
      }
    });

    // 削除された証跡をチェック
    if (prevEvidences.length > currEvidences.length) {
      for (let i = currEvidences.length; i < prevEvidences.length; i++) {
        diff.evidences.push({
          company_id: companyId,
          evidence_index: i,
          type: 'removed',
        });
      }
    }
  });

  // 削除された企業の証跡も削除扱い
  prevEvidenceByCompany.forEach((prevEvidences, companyId) => {
    if (!currEvidenceByCompany.has(companyId)) {
      prevEvidences.forEach((_, index) => {
        diff.evidences.push({
          company_id: companyId,
          evidence_index: index,
          type: 'removed',
        });
      });
    }
  });

  return diff;
}

/**
 * 企業が差分を持っているかチェック
 */
export function hasCompanyDiff(
  companyId: number,
  diff: ReviewDiff
): boolean {
  const companyDiff = diff.companies.find(c => c.company_id === companyId);
  if (companyDiff && companyDiff.type !== 'unchanged') {
    return true;
  }

  // 証跡に変更があるかチェック
  const evidenceDiffs = diff.evidences.filter(e => e.company_id === companyId);
  return evidenceDiffs.some(e => e.type !== 'unchanged');
}

/**
 * 証跡が差分を持っているかチェック
 */
export function hasEvidenceDiff(
  companyId: number,
  evidenceIndex: number,
  diff: ReviewDiff
): DiffType {
  const evidenceDiff = diff.evidences.find(
    e => e.company_id === companyId && e.evidence_index === evidenceIndex
  );
  return evidenceDiff?.type || 'unchanged';
}