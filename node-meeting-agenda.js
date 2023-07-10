#!/usr/bin/env node

'use strict'

const ghauth = require('ghauth')
const ghrepos = require('ghrepos')
const ghissues = require('ghissues')
const map = require('map-async')

const authOptions = { configName: 'iojs-tools', scopes: ['user', 'repo'] }
const repos = [] // { org: 'joyent', repo: 'node' } ]

if (process.argv.length < 3) { throw new Error('Please supply a label, e.g. `node-meeting-agenda ctc-agenda') }

const labels = process.argv[2]
const org = process.argv[3] || 'nodejs'

ghauth(authOptions, (err, authData) => {
  if (err) { throw err }

  function fetchIssues (repo, callback) {
    ghissues.list(
      authData
      , repo.org
      , repo.repo
      , { state: 'open', labels }
      , callback
    )
  }

  ghrepos.listOrg(authData, org, { type: 'public' }, (err, repolist) => {
    if (err) { throw err }

    const ra = repos.concat(repolist.map((r) => ({ org, repo: r.name })))
    map(ra, fetchIssues, (err, repoLists) => {
      if (err) { throw err }
      printIssues(ra, repoLists)
    })
  })
})

function cleanMarkdown (txt) {
  // just escape '[' & ']'
  return txt.replace(/([[\]])/g, '\\$1')
}

function printIssues (ra, repoLists) {
  repoLists.forEach(function (list, i) {
    if (!list.length) { return }
    console.log(`### ${ra[i].org}/${ra[i].repo}\n`)

    console.log(list.map((issue) => {
      return `* ${cleanMarkdown(issue.title)} [#${issue.number}](${issue.html_url})`
    }).join('\n') + '\n')
  })
}
