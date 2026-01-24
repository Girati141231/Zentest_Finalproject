
export const generatePlaywrightScript = (steps: any[]): string => {
    let script = `import { test, expect } from '@playwright/test';\n\n`;
    script += `test('Generated Automation', async ({ page }) => {\n`;
    script += `  // Auto-generated script from Automation Hub\n`;
    script += `  test.setTimeout(60000);\n\n`;

    steps.forEach((step, index) => {
        script += `  // Step ${index + 1}: ${step.type} - ${step.tagName || 'Action'}\n`;

        // Add delay if specified
        if (step.delay && step.delay > 0) {
            script += `  await page.waitForTimeout(${step.delay});\n`;
        }

        if (step.url && index === 0) {
            script += `  await page.goto('${step.url}');\n`;
        }

        switch (step.type) {
            case 'CLICK':
                if (step.xpath) {
                    script += `  await page.locator('${step.xpath}').click();\n`;
                } else if (step.id) {
                    script += `  await page.locator('#${step.id}').click();\n`;
                } else if (step.className) {
                    const selector = step.className.trim().split(/\s+/).join('.');
                    script += `  await page.locator('.${selector}').first().click();\n`;
                } else if (step.text && step.tagName) {
                    script += `  await page.locator('${step.tagName.toLowerCase()}:has-text("${step.text.replace(/\n/g, ' ')}")').first().click();\n`;
                } else {
                    script += `  // TODO: improved selector strategy needed for this step\n`;
                }
                break;

            case 'INPUT':
                const value = step.value || '';
                if (step.xpath) {
                    script += `  await page.locator('${step.xpath}').fill('${value}');\n`;
                } else if (step.id) {
                    script += `  await page.locator('#${step.id}').fill('${value}');\n`;
                } else if (step.name) {
                    script += `  await page.locator('[name="${step.name}"]').fill('${value}');\n`;
                } else if (step.placeholder) {
                    script += `  await page.locator('[placeholder="${step.placeholder}"]').fill('${value}');\n`;
                } else {
                    script += `  // TODO: improved selector strategy needed for this step\n`;
                }
                break;

            default:
                script += `  // Unknown action type: ${step.type}\n`;
        }
        script += `\n`;
    });

    script += `});`;
    return script;
};
