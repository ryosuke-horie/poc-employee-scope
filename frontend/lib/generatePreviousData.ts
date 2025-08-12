import { ReviewBundle } from '@/types/review';

/**
 * 現在のデータを少し変更して前回データのサンプルを生成
 * デモ/テスト用の機能
 */
export function generatePreviousDataSample(current: ReviewBundle): ReviewBundle {
  const previous: ReviewBundle = JSON.parse(JSON.stringify(current));
  
  // generated_atを過去の日時に変更
  const currentDate = new Date(previous.generated_at);
  currentDate.setDate(currentDate.getDate() - 7);
  previous.generated_at = currentDate.toISOString();
  
  // いくつかの企業を削除（新規追加をシミュレート）
  if (previous.companies.length > 5) {
    const removedCompany = previous.companies.pop();
    if (removedCompany) {
      // 削除した企業の証跡も削除
      previous.evidence = previous.evidence.filter(
        e => e.company_id !== removedCompany.id
      );
      previous.review_state = previous.review_state.filter(
        r => r.company_id !== removedCompany.id
      );
    }
  }
  
  // いくつかの証跡の値を変更（値の変更をシミュレート）
  previous.evidence.forEach((evidence, index) => {
    if (index % 3 === 0 && evidence.value !== null) {
      // 3つに1つの証跡の値を変更
      evidence.value = Math.floor(evidence.value * 0.9);
    }
    if (index % 5 === 0 && evidence.score !== null) {
      // 5つに1つの証跡のスコアを変更
      evidence.score = Math.max(0, evidence.score - 0.1);
    }
  });
  
  // いくつかの証跡を削除（新規証跡をシミュレート）
  if (previous.evidence.length > 10) {
    const companyWithMultipleEvidences = previous.companies.find(company => {
      const evidenceCount = previous.evidence.filter(e => e.company_id === company.id).length;
      return evidenceCount > 2;
    });
    
    if (companyWithMultipleEvidences) {
      const targetEvidences = previous.evidence.filter(
        e => e.company_id === companyWithMultipleEvidences.id
      );
      if (targetEvidences.length > 0) {
        // 最後の証跡を削除
        const lastEvidence = targetEvidences[targetEvidences.length - 1];
        previous.evidence = previous.evidence.filter(
          e => !(e.company_id === lastEvidence.company_id && 
                e.source_url === lastEvidence.source_url)
        );
      }
    }
  }
  
  // レビュー状態をリセット（未判定状態に戻す）
  previous.review_state = previous.review_state.map(state => ({
    ...state,
    decision: 'unknown',
    decided_at: undefined,
  }));
  
  return previous;
}