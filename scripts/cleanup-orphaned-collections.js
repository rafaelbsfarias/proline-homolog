#!/usr/bin/env node

/**
 * Script para limpeza de collections órfãs no banco de dados
 * Remove collections que não estão associadas a nenhum veículo
 */

const { Client } = require('pg');
require('dotenv').config();

class OrphanedCollectionsCleaner {
    constructor() {
        this.client = new Client({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 54322,
            database: process.env.DB_NAME || 'postgres',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
        });
    }

    async connect() {
        try {
            await this.client.connect();
            console.log('✅ Conectado ao banco de dados');
        } catch (error) {
            console.error('❌ Erro ao conectar:', error.message);
            throw error;
        }
    }

    async disconnect() {
        try {
            await this.client.end();
            console.log('✅ Conexão fechada');
        } catch (error) {
            console.error('❌ Erro ao fechar conexão:', error.message);
        }
    }

    async findOrphanedCollections() {
        try {
            console.log('\n🔍 Procurando collections órfãs...');

            const query = `
                SELECT
                    vc.id,
                    vc.status,
                    vc.created_at,
                    vc.updated_at,
                    vc.estimated_arrival_date,
                    vc.vehicle_id,
                    v.plate as vehicle_plate
                FROM vehicle_collections vc
                LEFT JOIN vehicles v ON vc.vehicle_id = v.id
                WHERE vc.vehicle_id IS NULL
                   OR v.id IS NULL
                ORDER BY vc.created_at DESC;
            `;

            const result = await this.client.query(query);
            return result.rows;
        } catch (error) {
            console.error('❌ Erro ao buscar collections órfãs:', error.message);
            throw error;
        }
    }

    async getCollectionDetails(collectionId) {
        try {
            const query = `
                SELECT
                    vc.*,
                    json_agg(ch.*) as history
                FROM vehicle_collections vc
                LEFT JOIN collection_history ch ON vc.id = ch.collection_id
                WHERE vc.id = $1
                GROUP BY vc.id;
            `;

            const result = await this.client.query(query, [collectionId]);
            return result.rows[0];
        } catch (error) {
            console.error('❌ Erro ao buscar detalhes da collection:', error.message);
            return null;
        }
    }

    async deleteOrphanedCollection(collectionId, dryRun = true) {
        try {
            if (dryRun) {
                console.log(`🔍 [DRY RUN] Collection ${collectionId} seria deletada`);
                return true;
            }

            // Primeiro, deletar histórico relacionado
            await this.client.query('DELETE FROM collection_history WHERE collection_id = $1', [collectionId]);

            // Depois, deletar a collection
            const result = await this.client.query('DELETE FROM vehicle_collections WHERE id = $1', [collectionId]);

            return result.rowCount > 0;
        } catch (error) {
            console.error(`❌ Erro ao deletar collection ${collectionId}:`, error.message);
            return false;
        }
    }

    async cleanupOrphanedCollections(dryRun = true) {
        try {
            const orphanedCollections = await this.findOrphanedCollections();

            if (orphanedCollections.length === 0) {
                console.log('✅ Nenhuma collection órfã encontrada!');
                return { cleaned: 0, errors: 0 };
            }

            console.log(`\n🚨 Encontradas ${orphanedCollections.length} collections órfãs:`);

            let cleaned = 0;
            let errors = 0;

            for (const collection of orphanedCollections) {
                console.log(`\n📦 Collection ID: ${collection.id}`);
                console.log(`   Status: ${collection.status}`);
                console.log(`   Criada em: ${collection.created_at}`);
                console.log(`   Data estimada: ${collection.estimated_arrival_date}`);
                console.log(`   Vehicle ID: ${collection.vehicle_id || 'NULL'}`);
                console.log(`   Vehicle Plate: ${collection.vehicle_plate || 'N/A'}`);

                // Buscar detalhes e histórico
                const details = await this.getCollectionDetails(collection.id);
                if (details && details.history && details.history.length > 0) {
                    console.log(`   Histórico: ${details.history.length} registros`);
                }

                // Tentar deletar
                const success = await this.deleteOrphanedCollection(collection.id, dryRun);
                if (success) {
                    cleaned++;
                    console.log(`   ✅ ${dryRun ? 'Seria deletada' : 'Deletada'} com sucesso`);
                } else {
                    errors++;
                    console.log(`   ❌ Falha ao deletar`);
                }
            }

            console.log(`\n📊 Resumo da limpeza:`);
            console.log(`   Collections processadas: ${orphanedCollections.length}`);
            console.log(`   ${dryRun ? 'Seriam' : 'Foram'} limpas: ${cleaned}`);
            console.log(`   Erros: ${errors}`);

            return { cleaned, errors };
        } catch (error) {
            console.error('❌ Erro durante limpeza:', error.message);
            throw error;
        }
    }

    async generateReport(cleaned, errors, dryRun) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = `/home/rafael/workspace/proline-homolog/reports/cleanup-report-${timestamp}.json`;

        const report = {
            timestamp: new Date().toISOString(),
            operation: dryRun ? 'dry-run' : 'cleanup',
            results: {
                cleaned,
                errors,
                total_processed: cleaned + errors
            },
            recommendations: [
                'Execute sem --dry-run para aplicar as mudanças',
                'Faça backup do banco antes da limpeza real',
                'Verifique se as collections órfãs não são necessárias',
                'Execute check-database-state-pg.js após a limpeza'
            ]
        };

        // Salvar relatório
        const fs = require('fs');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Relatório salvo em: ${reportPath}`);

        return reportPath;
    }

    async run(dryRun = true) {
        try {
            console.log('🧹 Iniciando limpeza de collections órfãs...');
            console.log(`Modo: ${dryRun ? 'DRY RUN (simulação)' : 'LIMPEZA REAL'}`);

            await this.connect();

            const { cleaned, errors } = await this.cleanupOrphanedCollections(dryRun);

            const reportPath = await this.generateReport(cleaned, errors, dryRun);

            console.log('\n🎉 Processo concluído!');
            console.log(`Relatório: ${reportPath}`);

            if (dryRun && cleaned > 0) {
                console.log('\n💡 Para executar a limpeza real, rode:');
                console.log('node scripts/cleanup-orphaned-collections.js --real');
            }

        } catch (error) {
            console.error('❌ Erro durante execução:', error.message);
            process.exit(1);
        } finally {
            await this.disconnect();
        }
    }
}

// Executar script
const dryRun = !process.argv.includes('--real');

const cleaner = new OrphanedCollectionsCleaner();
cleaner.run(dryRun);
