import type {Rule} from 'eslint'

const collapseExportBlockRule: Rule.RuleModule = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Collapse multi-line named export blocks.',
    },
    fixable: 'whitespace',
    schema: [],
    messages: {
      collapse: 'Collapse multi-line named export block.',
    },
  },
  create(context) {
    return {
      ExportNamedDeclaration(node) {
        if (node.declaration || !node.specifiers.length || node.source) {
          return
        }
        const sourceCode = context.sourceCode
        const text = sourceCode.getText(node)
        if (!text.includes('\n')) {
          return
        }
        const specifierText = node.specifiers.map(specifier => sourceCode.getText(specifier)).join(', ')
        context.report({
          node,
          messageId: 'collapse',
          fix(fixer) {
            return fixer.replaceText(node, `export {${specifierText}}`)
          },
        })
      },
    }
  },
}

export default collapseExportBlockRule
