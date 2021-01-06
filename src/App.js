import React, { Component } from 'react'
import { ApolloProvider, Mutation, Query } from 'react-apollo'
import client from './client'
import { ADD_STAR, REMOVE_STAR, SEARCH_REPOSITORIES } from './graphql'

const StarButton = props => {
  const { node, query, first, last, before, after } = props
  const starCount = node.stargazers.totalCount
  const viewerHasStarred = node.viewerHasStarred
  const starCountUnit = starCount === 1 ? "1 star" : `${starCount} stars`
  const StarStatus = ({addOrRemoveStar}) => { // mutation 받아서 씀
    return (
      <button
        onClick={
          () => {
            addOrRemoveStar({
              variables: { input: { starrableId: node.id }}, // 얘도 컴포넌트 사용 하는 쪽에서 던져준 props를 사용하는거임.
              update: (store, { data: { addStar, removeStar }}) => { // response값을 로그로 확인하고 addStar, removeStar 추가함
                console.log(addStar)
                console.log(removeStar)
                const { starrable } = addStar || removeStar
                const data = store.readQuery({ // 쿼리를 직접 날려서 데이터를 가져오는 것이 아니라 메모리상 데이터를 다시 취득
                  query: SEARCH_REPOSITORIES,
                  variables: { query, first, last, after, before }
                })
                const edges = data.search.edges
                const newEdges = edges.map(edge => {
                  if (edge.node.id === node.id) {
                    const totalCount = edge.node.stargazers.totalCount
                    // const diff = viewerHasStarred ? -1 : 1
                    const diff = starrable.viewerHasStarred ? 1 : -1
                    const newTotalCount = totalCount + diff
                    edge.node.stargazers.totalCount = newTotalCount
                  }
                  return edge
                })
                data.search.edge = newEdges
                store.writeQuery({
                  query: SEARCH_REPOSITORIES,
                  data
                })
              }
            })          }
        }
      >
        {starCountUnit} | {viewerHasStarred ? 'starred' : '-'}
      </button>
    )
  }

  return (
    <Mutation 
      mutation={viewerHasStarred ? REMOVE_STAR : ADD_STAR}
      
    >
      {
        addOrRemoveStar => <StarStatus addOrRemoveStar={addOrRemoveStar}/> //mutataion을 컴포넌트로 던져줌
      }
    </Mutation>
  )

}

const PER_PAGE = 5
const DEFAULT_STATE = {
  first: PER_PAGE,
  after: null,
  last: null,
  before: null,
  query: ""
}

class App extends Component {
  constructor(props) {
    super(props) 
    this.state = DEFAULT_STATE

    this.myRef = React.createRef()
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleSubmit(event) {
    event.preventDefault()

    this.setState({ 
      query: this.myRef.current.value
    })
  }

  goNext(search) {
    this.setState({
      first: PER_PAGE,
      after: search.pageInfo.endCursor,
      last: null,
      before: null
    })
  }

  goPrevious(search) {
    this.setState({
      first: null,
      after: null,
      last: PER_PAGE,
      before: search.pageInfo.startCursor
    })
  }

  render() {
    const { query, first, last, before, after } = this.state

    return (
      <ApolloProvider client={client}>
        <form onSubmit={this.handleSubmit}>
          <input ref={this.myRef}/>
          <input type="submit" value="Submit" />
        </form>
        <Query
          query={SEARCH_REPOSITORIES}
          variables={{ query, first, last, before, after}}
        >
          {
            ({ loading, error, data}) => {
              if (loading) return 'Loading...'
              if (error) return `Error! ${error.message}`

              const search = data.search
              const repositoryCount = search.repositoryCount
              const repositoryUnit = repositoryCount === 1 ? 'Repository' : 'Repositories' 
              const title = `Github Repositories Search Results - ${repositoryCount} ${repositoryUnit}`
              return (
              <React.Fragment>
                <h2>{title}</h2>
                <ul>
                  { 
                    search.edges.map(edge => {
                      const node = edge.node
                      return (
                        <li key={node.id}>
                          <a href={node.url} target="_blank" rel="noopner noreferrer">{node.name}</a>
                          &nbsp;
                          <StarButton node={node} {...{query, first, last, after, before}} />
                        </li>
                      )
                    })
                  }
                </ul>
                {
                  search.pageInfo.hasPreviousPage === true ?
                  <button
                    onClick={this.goPrevious.bind(this, search)}
                  >
                    Previous
                  </button>
                  :
                  null
                }
                {
                  search.pageInfo.hasNextPage === true ? 
                    <button
                      onClick={this.goNext.bind(this, search)}
                    >
                      Next
                    </button>
                    :
                    null
                }
              </React.Fragment>
              )
            }
          }
        </Query>
      </ApolloProvider>
    );
  }
}

export default App;
