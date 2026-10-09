/** Real authenticated local UI checks; synthetic demo database only. No API mocks. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
	const base = process.env.CHAT_AI_QA_URL || 'http://localhost:3003';
	if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname))
		throw Error('This fixture smoke test is restricted to localhost.');
	const out = path.resolve('test-artifacts/chat-ai');
	fs.mkdirSync(out, { recursive: true });
	const browser = await chromium.launch({ channel: 'chrome', headless: true });
	const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
	const page = await context.newPage();
	const checks = [];
	page.setDefaultTimeout(30000);
	page.setDefaultNavigationTimeout(30000);
	const check = (name, passed) => {
		checks.push({ name, passed });
		console.log(JSON.stringify({ check: name, passed }));
		if (!passed) throw Error(name);
	};
	const errors = [];
	page.on('pageerror', (error) => errors.push(error.message));
	try {
		await page.goto(base + '/login');
		check('No FAB on login', (await page.getByRole('button', { name: 'Ask AI Assistant' }).count()) === 0);
		await page.locator('input[type=email]').fill('assistant-writer@example.test');
		await page.locator('input[type=password]').fill(process.env.CHAT_AI_QA_PASSWORD || 'DemoAssistant2026!');
		await page.getByRole('button', { name: 'Me connecter' }).click();
		await page.waitForURL('**/dashboard**', { timeout: 30000 });
		const fab = page.getByRole('button', { name: 'Ask AI Assistant' });
		await fab.waitFor({ timeout: 30000 });
		check('Single FAB on dashboard', (await fab.count()) === 1);
		const dimensions = await fab.evaluate((e) => ({
			position: getComputedStyle(e).position,
			width: e.getBoundingClientRect().width,
			height: e.getBoundingClientRect().height,
			color: getComputedStyle(e).color,
			background: getComputedStyle(e).backgroundColor,
		}));
		check(
			'Fixed 56px Facturation accent FAB with white icon',
			dimensions.position === 'fixed' &&
				dimensions.width === 56 &&
				dimensions.height === 56 &&
				dimensions.color === 'rgb(255, 255, 255)' &&
				dimensions.background === 'rgba(2, 116, 215, 0.5)',
		);
		await fab.click();
		const panel = page.getByRole('dialog', { name: 'AI Assistant' });
		await panel.waitFor();
		check('Management Projet heading', await panel.getByText('Management Projet', { exact: true }).isVisible());
		const input = page.getByRole('textbox', { name: 'Votre message' });
		await input.fill('/voir');
		await page.getByRole('button', { name: 'Envoyer', exact: true }).click();
		await panel.getByText(/sans avoir à connaître son identifiant/).waitFor();
		check('Bare slash returns useful guidance', true);
		await input.fill('/projets');
		await page.getByRole('button', { name: 'Envoyer', exact: true }).click();
		await panel.getByText('Demo Cobalt', { exact: true }).waitFor();
		check('Authenticated SSE search returns native project data', true);
		await page.screenshot({ path: path.join(out, 'desktop.png') });

		await panel.getByRole('button', { name: 'Voir', exact: true }).first().click();
		await page.waitForURL('**/dashboard/projects/*');
		check('Validated project navigation', true);
		check('Chat persists after route navigation', await panel.getByText('Demo Cobalt', { exact: true }).isVisible());
		await page.getByRole('button', { name: 'Fermer', exact: true }).click();
		await page.getByRole('main').getByRole('button', { name: 'Liste des projets', exact: true }).click();
		await page.waitForURL('**/dashboard/projects');
		check('Detail back control returns to the list', true);
		await fab.click();
		await input.fill('Draft retained');
		await page.getByRole('button', { name: 'Fermer', exact: true }).click();
		await fab.click();
		check('Minimizing preserves draft', (await input.inputValue()) === 'Draft retained');
		await page.setViewportSize({ width: 390, height: 844 });
		if (await page.locator('.MuiDrawer-root.MuiModal-root').count()) {
			await page.waitForTimeout(200);
			check('Assistant yields to the native mobile drawer', !(await page.locator('#chat-ai-panel').isVisible()));
			await page.keyboard.press('Escape');
			await panel.waitFor();
		}
		const box = await panel.boundingBox();
		check(
			'Mobile panel stays within viewport',
			box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 391 && box.y + box.height <= 845,
		);
		check('Mobile composer visible', await input.isVisible());
		await page.screenshot({ path: path.join(out, 'mobile.png') });
		await page.setViewportSize({ width: 1440, height: 1000 });
		await input.fill('How do I create a project?');
		await page.getByRole('button', { name: 'Envoyer', exact: true }).click();
		await panel.getByText(/Open “Projects”/).waitFor();
		check('English answer follows current message without an assistant language selector', true);
		await input.fill('/revenus');
		await page.getByRole('button', { name: 'Envoyer', exact: true }).click();
		const receipt = panel.locator('.MuiPaper-outlined').filter({ hasText: 'Deposit demo' });
		await receipt.waitFor();
		await receipt.getByRole('button', { name: 'Supprimer', exact: true }).click();
		await panel.getByRole('button', { name: 'Vérifier cette action', exact: true }).last().click();
		const confirmDialog = page.getByRole('dialog');
		await confirmDialog
			.getByText(/Deposit demo/)
			.first()
			.waitFor();
		check('Write requires explicit target review', true);
		const confirmed = page.waitForResponse(
			(response) => response.url().includes('/actions/') && response.url().endsWith('/confirm/'),
		);
		await confirmDialog.getByRole('button', { name: 'Confirmer cette action', exact: true }).click();
		const confirmation = await confirmed;
		await page.waitForURL('**/dashboard/revenues');
		check('Native confirmed fixture deletion succeeds', confirmation.status() === 200);
		await page.getByRole('button', { name: 'Fermer', exact: true }).click();
		await page.getByRole('button', { name: /Se déconnecter/i }).click();
		await page.waitForURL('**/login');
		check('Logout removes assistant context', (await fab.count()) === 0);
		await page.locator('input[type=email]').fill('assistant-reader@example.test');
		await page.locator('input[type=password]').fill(process.env.CHAT_AI_QA_PASSWORD || 'DemoAssistant2026!');
		await page.getByRole('button', { name: 'Me connecter' }).click();
		await page.waitForURL('**/dashboard**');
		await fab.waitFor();
		await fab.click();
		await input.fill('/projets');
		await page.getByRole('button', { name: 'Envoyer', exact: true }).click();
		await panel.getByText('Demo Cobalt', { exact: true }).waitFor();
		check('Read-only account can search native records', true);
		check(
			'Read-only account has no edit/delete/print actions',
			(await panel.getByRole('button', { name: 'Modifier', exact: true }).count()) === 0 &&
				(await panel.getByRole('button', { name: 'Supprimer', exact: true }).count()) === 0 &&
				(await panel.getByRole('button', { name: 'PDF', exact: true }).count()) === 0,
		);
		check('No uncaught page errors', errors.length === 0);
	} catch (error) {
		await page.screenshot({ path: path.join(out, 'failure.png') });
		console.log((await page.locator('body').innerText()).slice(-2500));
		throw error;
	} finally {
		fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify({ checks, page_errors: errors }, null, 2));
		await browser.close();
	}
	console.log(JSON.stringify({ passed: checks.filter((x) => x.passed).length, total: checks.length }));
})().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
