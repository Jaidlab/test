import type {AST} from 'eslint'

export type BodyNodeLike = {
  body?: Array<NodeWithRange>
  members?: Array<NodeWithRange>
  range?: AST.Range
}

export type CommentLike = {
  loc?: AST.SourceLocation
  range?: AST.Range
  type: 'Block' | 'Line'
}

export type NodeWithRange = {
  range?: AST.Range
}
