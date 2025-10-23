import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Vytvor tabuľku bank_accounts
  await knex.schema.createTable('bank_accounts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('iban', 34).notNullable().unique();
    table.string('swift_bic', 11);
    table.string('bank_name', 255);
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_default').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Index pre rýchle vyhľadávanie aktívnych účtov
    table.index(['is_active'], 'idx_bank_accounts_active');
  });

  // Pridaj check constraint pre IBAN formát
  await knex.raw(`
    ALTER TABLE bank_accounts
    ADD CONSTRAINT valid_iban CHECK (iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]+$')
  `);

  // 2. Vytvor tabuľku payment_orders
  await knex.schema.createTable('payment_orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.integer('rental_id').notNullable().references('id').inTable('rentals').onDelete('CASCADE');
    table.uuid('bank_account_id').notNullable().references('id').inTable('bank_accounts');

    // Typ platby
    table.string('type', 20).notNullable();

    // Platobné údaje
    table.decimal('amount', 10, 2).notNullable();
    table.string('currency', 3).defaultTo('EUR');
    table.string('variable_symbol', 20).notNullable();
    table.string('specific_symbol', 20);
    table.string('constant_symbol', 4);

    // QR kód dáta
    table.text('qr_code_data').notNullable();
    table.text('qr_code_image');

    // Správa pre príjemcu
    table.string('message', 140);

    // PDF
    table.text('pdf_url');
    table.timestamp('pdf_generated_at');

    // Email
    table.boolean('email_sent').defaultTo(false);
    table.timestamp('email_sent_at');
    table.string('email_recipient', 255);

    // Status
    table.string('payment_status', 20).defaultTo('pending');
    table.timestamp('paid_at');

    // Audit
    table.uuid('created_by').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexy
    table.index(['rental_id'], 'idx_payment_orders_rental');
    table.index(['payment_status'], 'idx_payment_orders_status');
    table.index(['created_at'], 'idx_payment_orders_created');

    // Unique constraint - jeden príkaz na typ pre rental
    table.unique(['rental_id', 'type'], 'unique_rental_type');
  });

  // Pridaj check constraints
  await knex.raw(`
    ALTER TABLE payment_orders
    ADD CONSTRAINT valid_type CHECK (type IN ('rental', 'deposit')),
    ADD CONSTRAINT valid_amount CHECK (amount > 0),
    ADD CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'cancelled'))
  `);

  // 3. Vlož default bankový účet (placeholder - používateľ si ho upraví)
  await knex('bank_accounts').insert({
    name: 'Hlavný účet BlackRent',
    iban: 'SK0000000000000000000000', // Placeholder
    bank_name: 'Banka (upraviť)',
    is_active: true,
    is_default: true,
  });

  console.log('✅ Payment orders tables created successfully');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payment_orders');
  await knex.schema.dropTableIfExists('bank_accounts');
  console.log('✅ Payment orders tables dropped successfully');
}

