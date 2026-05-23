import type {BodyNodeLike} from '../lib/types.ts'
import type {AST, Rule} from 'eslint'

const collapseSingleMemberBody = (context: Rule.RuleContext, bodyNode?: BodyNodeLike) => {
  if (!bodyNode?.range) {
    return
  }
  const members = bodyNode.body ?? bodyNode.members ?? []
  if (members.length !== 1) {
    return
  }
  const member = members[0]
  if (!member.range) {
    return
  }
  const sourceCode = context.sourceCode
  const openBrace = sourceCode.getFirstToken(bodyNode as never, {filter: (token: AST.Token) => token.value === '{'})
  const closeBrace = sourceCode.getLastToken(bodyNode as never, {filter: (token: AST.Token) => token.value === '}'})
  if (!openBrace || !closeBrace) {
    return
  }
  const beforeMember = sourceCode.text.slice(openBrace.range[1], member.range[0])
  const afterMember = sourceCode.text.slice(member.range[1], closeBrace.range[0])
  if (beforeMember.trim() !== '' || afterMember.trim() !== '') {
    return
  }
  const memberText = sourceCode.text.slice(member.range[0], member.range[1]).replace(/;\s*$/u, '')
  const replacementText = `{${memberText}}`
  const currentText = sourceCode.text.slice(openBrace.range[0], closeBrace.range[1])
  if (currentText === replacementText) {
    return
  }
  context.report({
    node: member as never,
    messageId: 'collapse',
    fix(fixer) {
      return fixer.replaceTextRange([openBrace.range[0], closeBrace.range[1]], `{${memberText}}`)
    },
  })
}
const collapseSingleMemberRule: Rule.RuleModule = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Collapse single-member class or interface bodies.',
    },
    fixable: 'whitespace',
    schema: [],
    messages: {
      collapse: 'Collapse single-member class or interface body.',
    },
  },
  create(context) {
    return {
      ClassDeclaration(node) {
        collapseSingleMemberBody(context, (node as {body?: BodyNodeLike}).body)
      },
      TSInterfaceDeclaration(node: {body?: BodyNodeLike}) {
        collapseSingleMemberBody(context, node.body)
      },
    } as Rule.RuleListener
  },
}

export default collapseSingleMemberRule
