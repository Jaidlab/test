import type {Rule} from 'eslint'

const removeEmptyExportRule: Rule.RuleModule = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Remove empty export markers.',
    },
    fixable: 'whitespace',
    schema: [],
    messages: {
      remove: 'Remove empty “export {}” module marker.',
    },
  },
  create(context) {
    return {
      ExportNamedDeclaration(node) {
        if (node.declaration || node.specifiers.length || node.source) {
          return
        }
        context.report({
          node,
          messageId: 'remove',
          fix(fixer) {
            return fixer.remove(node)
          },
        })
      },
    }
  },
}

export default removeEmptyExportRule
