-- 무통장입금(토스 가상계좌). 승인하면 입금대기(AWAITING_DEPOSIT)로 두고, 입금 웹훅(DEPOSIT_CALLBACK)이 오면 결제완료.
-- method: PG 가 알려 준 결제수단(카드·가상계좌 등). secret: 입금 웹훅 검증 값.
ALTER TABLE payment ADD COLUMN method VARCHAR(30);
ALTER TABLE payment ADD COLUMN secret VARCHAR(64);
ALTER TABLE payment ADD COLUMN va_bank_code VARCHAR(10);
ALTER TABLE payment ADD COLUMN va_account_number VARCHAR(30);
ALTER TABLE payment ADD COLUMN va_customer_name VARCHAR(100);
ALTER TABLE payment ADD COLUMN va_due_at DATETIME(6);

-- 입금 기한이 지난 가상계좌를 찾는다.
CREATE INDEX idx_payment_status_due ON payment (status, va_due_at);
