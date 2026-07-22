const { supabase, supabaseAuth } = require('../db');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = header.split(' ')[1];
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile) {
    return res.status(401).json({ error: 'Profile not found' });
  }
  if (!['superadmin', 'ghost'].includes(profile.role) && !profile.approved) {
    return res.status(403).json({ error: 'Account not yet approved by an admin' });
  }
  req.user = { ...profile, email: user.email };
  next();
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

function requireOrg(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role === 'ghost') return next();
  if (!req.user.org_id) {
    return res.status(403).json({ error: 'No organization associated with this account' });
  }
  next();
}

function canAccessUser(targetUserId) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    // Ghost can only access self
    if (req.user.role === 'ghost') {
      if (String(req.user.id) === String(targetUserId)) return next();
      return res.status(403).json({ error: 'Cannot access this users data' });
    }

    // Superadmin: same org only
    if (req.user.role === 'superadmin') {
      const { data: target } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', targetUserId)
        .maybeSingle();
      if (!target) return res.status(404).json({ error: 'User not found' });
      if (target.org_id !== req.user.org_id) return res.status(403).json({ error: 'User not in your organization' });
      return next();
    }

    // Admin: own clients in same org
    if (req.user.role === 'admin') {
      if (!targetUserId) return res.status(400).json({ error: 'No user specified' });
      const { data: profile } = await supabase
        .from('profiles')
        .select('admin_id, org_id')
        .eq('id', targetUserId)
        .maybeSingle();
      if (!profile) return res.status(404).json({ error: 'User not found' });
      if (profile.org_id !== req.user.org_id) return res.status(403).json({ error: 'User not in your organization' });
      if (profile.admin_id !== req.user.id) return res.status(403).json({ error: 'Not your client' });
      return next();
    }

    // Client: self only
    if (String(req.user.id) === String(targetUserId)) return next();
    return res.status(403).json({ error: 'Cannot access this users data' });
  };
}

module.exports = { authenticate, authorize, requireOrg, canAccessUser };
