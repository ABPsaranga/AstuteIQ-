import api from '../../lib/api'

export const getBillingOverview = async () => {
  const { data } = await api.get('/billing/overview')
  return data
}

export const getPlans = async () => {
  const { data } = await api.get('/billing/plans')
  return data
}

export const getTransactions = async () => {
  const { data } = await api.get('/billing/transactions')
  return data
}