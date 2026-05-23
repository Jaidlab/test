import type {CommentLike} from '../lib/types.ts'
import type {Rule} from 'eslint'

const normalizeCommentsRule: Rule.RuleModule = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Normalize block comment whitespace.',
    },
    fixable: 'whitespace',
    schema: [],
    messages: {
      normalize: 'Normalize leading and trailing whitespace in block comments.',
    },
  },
  create(context) {
    return {
      Program() {
        const sourceCode = context.sourceCode
        for (const comment of sourceCode.getAllComments() as Array<CommentLike>) {
          if (comment.type !== 'Block' || !comment.loc || !comment.range) {
            continue
          }
          const commentLocation = comment.loc
          const commentRange = comment.range
          const commentText = sourceCode.text.slice(commentRange[0], commentRange[1])
          const normalizedCommentText = commentText.split('\n').map(line => line.trim()).join('\n')
          if (normalizedCommentText === commentText) {
            continue
          }
          context.report({
            loc: commentLocation,
            messageId: 'normalize',
            fix(fixer) {
              return fixer.replaceTextRange(commentRange, normalizedCommentText)
            },
          })
        }
      },
    }
  },
}

export default normalizeCommentsRule
