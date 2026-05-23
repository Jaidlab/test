import type {CommentLike} from '../lib/types.ts'
import type {Rule} from 'eslint'

const stripLineCommentsRule: Rule.RuleModule = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Remove line comments.',
    },
    fixable: 'whitespace',
    schema: [],
    messages: {
      strip: 'Remove line comments.',
    },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments() as Array<CommentLike>) {
          if (comment.type !== 'Line' || !comment.loc || !comment.range) {
            continue
          }
          const commentLocation = comment.loc
          const commentRange = comment.range
          context.report({
            loc: commentLocation,
            messageId: 'strip',
            fix(fixer) {
              return fixer.removeRange(commentRange)
            },
          })
        }
      },
    }
  },
}

export default stripLineCommentsRule
