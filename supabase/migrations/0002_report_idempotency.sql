alter table reports add column if not exists client_request_id text;
create unique index if not exists reports_client_request_id_idx on reports (client_request_id);
