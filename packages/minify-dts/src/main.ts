import {Linter} from 'eslint'

import stylistic from '@stylistic/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

const collapseSingleMemberBody = (context: any, bodyNode: any) => {
  const members = bodyNode.body ?? bodyNode.members
  if (members?.length !== 1) {
    return
  }
  const source = context.sourceCode
  const openBrace = source.getFirstToken(bodyNode, {filter: (token: any) => token.value === '{'})
  const closeBrace = source.getLastToken(bodyNode, {filter: (token: any) => token.value === '}'})
  if (!openBrace || !closeBrace) {
    return
  }
  const member = members[0]
  const memberStart = member.range![0]
  const memberEnd = member.range![1]
  const beforeMember = source.text.slice(openBrace.range[1], memberStart)
  const afterMember = source.text.slice(memberEnd, closeBrace.range[0])
  if (beforeMember.trim() !== '' || afterMember.trim() !== '') {
    return
  }
  let memberText = source.text.slice(memberStart, memberEnd)
  memberText = memberText.replace(/;\s*$/u, '')
  context.report({
    node: member,
    messageId: 'collapse',
    fix: (fixer: any) => fixer.replaceTextRange([openBrace.range[0], closeBrace.range[1]], `{${memberText}}`),
  })
}

export const createMinifyDtsConfig = (): Array<Linter.Config> => {
  return [
    {
      name: 'minify-dts',
      files: ['**/*.d.ts'],
      languageOptions: {
        parser: tsParser,
      },
      plugins: {
        '@stylistic': stylistic as any,
        'minify-dts': {
          rules: {
            'collapse-single-member': {
              meta: {
                type: 'layout' as const,
                fixable: 'whitespace' as const,
                messages: {
                  collapse: 'Collapse single-member class or interface body.',
                },
              },
              create(context: any) {
                return {
                  ClassDeclaration(node: any) {
                    collapseSingleMemberBody(context, node.body)
                  },
                  TSInterfaceDeclaration(node: any) {
                    collapseSingleMemberBody(context, node.body)
                  },
                }
              },
            },
            'collapse-export-block': {
              meta: {
                type: 'layout' as const,
                fixable: 'whitespace' as const,
                messages: {
                  collapse: 'Collapse multi-line named export block.',
                },
              },
              create(context: any) {
                return {
                  ExportNamedDeclaration(node: any) {
                    if (node.declaration || !node.specifiers?.length) {
                      return
                    }
                    const text = context.sourceCode.getText(node)
                    if (!text.includes('\n')) {
                      return
                    }
                    const names = node.specifiers.map((specifier: any) => {
                      const exportedName = specifier.exported.name
                      const localName = specifier.local.name
                      return exportedName === localName ? exportedName : `${localName} as ${exportedName}`
                    }).join(', ')
                    context.report({
                      node,
                      messageId: 'collapse',
                      fix: (fixer: any) => fixer.replaceText(node, `export {${names}}`),
                    })
                  },
                }
              },
            },
            'remove-empty-export': {
              meta: {
                type: 'layout' as const,
                fixable: 'whitespace' as const,
                messages: {
                  remove: 'Remove empty “export {}” module marker.',
                },
              },
              create(context: any) {
                return {
                  ExportNamedDeclaration(node: any) {
                    if (node.declaration || node.specifiers?.length || node.source) {
                      return
                    }
                    context.report({
                      node,
                      messageId: 'remove',
                      fix: (fixer: any) => fixer.remove(node),
                    })
                  },
                }
              },
            },
            'strip-line-comments': {
              meta: {
                type: 'layout' as const,
                fixable: 'whitespace' as const,
                messages: {
                  strip: 'Remove line comments.',
                },
              },
              create(context: any) {
                return {
                  Program() {
                    const sourceCode = context.sourceCode
                    const comments = sourceCode.getAllComments()
                    for (const comment of comments) {
                      if (comment.type !== 'Line') {
                        continue
                      }
                      context.report({
                        loc: comment.loc,
                        messageId: 'strip',
                        fix: (fixer: any) => fixer.remove(comment),
                      })
                    }
                  },
                }
              },
            },

            'normalize-comments': {
              meta: {
                type: 'layout' as const,
                fixable: 'whitespace' as const,
                messages: {
                  normalize: 'Normalize leading and trailing whitespace in block comments.',
                },
              },
              create(context: any) {
                return {
                  Program() {
                    const sourceCode = context.sourceCode
                    const text: string = sourceCode.text
                    const comments = sourceCode.getAllComments()
                    for (const comment of comments) {
                      if (comment.type !== 'Block') {
                        continue
                      }
                      const commentText: string = text.slice(comment.range[0], comment.range[1])
                      const lines = commentText.split('\n')
                      if (lines.length < 2) {
                        continue
                      }
                      let modified = false
                      const newLines = lines.map((line: string) => {
                        let trimmed = line.trimStart()
                        const beforeTrimEnd = trimmed
                        trimmed = trimmed.trimEnd()
                        if (trimmed === '*') {
                          trimmed = trimmed.trimEnd()
                        }
                        if (trimmed !== beforeTrimEnd) {
                          modified = true
                        }
                        return trimmed
                      })
                      if (!modified && newLines.every((newLine: string, index: number) => newLine === lines[index])) {
                        continue
                      }
                      context.report({
                        loc: comment.loc,
                        messageId: 'normalize',
                        fix: (fixer: any) => fixer.replaceTextRange(comment.range, newLines.join('\n')),
                      })
                    }
                  },
                }
              },
            },
          },
        },
      },
      rules: {
        '@stylistic/semi': ['error', 'never'] as const,
        '@stylistic/indent': ['error', 0] as const,
        '@stylistic/member-delimiter-style': [
          'error', {
            multiline: {
              delimiter: 'none' as const,
              requireLast: false,
            },
            singleline: {
              delimiter: 'comma' as const,
              requireLast: false,
            },
          },
        ] as const,
        '@stylistic/comma-dangle': ['error', 'never'] as const,
        'no-multiple-empty-lines': [
          'error', {
            max: 0,
          },
        ] as const,
        'minify-dts/collapse-single-member': 'error' as const,
        'minify-dts/collapse-export-block': 'error' as const,
        'minify-dts/remove-empty-export': 'error' as const,
        'minify-dts/strip-line-comments': 'error' as const,
        'minify-dts/normalize-comments': 'error' as const,
      },
    },
  ]
}

export const minifyDts = (code: string): string => {
  const linter = new Linter({configType: 'flat'})
  const result = linter.verifyAndFix(code, createMinifyDtsConfig(), 'input.d.ts')
  return result.output
}
